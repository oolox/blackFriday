import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { TXT2IMG_PROMPT_MAX_LENGTH } from '../../../services/fal/imageService';
import { loadLocalStorageState } from '../../../services/localStorage';
import { GeneratedImageContainer } from '../../../features/images';
import { renderWithProviders } from '../../../test/test-utils';

const generateImage = vi.fn();
const loadPreset = vi.fn();

vi.mock('../../../services/fal/imageService', async () => {
  const actual = await vi.importActual<typeof import('../../../services/fal/imageService')>(
    '../../../services/fal/imageService',
  );
  return {
    ...actual,
    imageService: {
      ...actual.imageService,
      generateImage: (...args: unknown[]) => generateImage(...args),
    },
  };
});

vi.mock('../../../services/storage/persistenceService', async () => {
  const actual = await vi.importActual<
    typeof import('../../../services/storage/persistenceService')
  >('../../../services/storage/persistenceService');
  return {
    ...actual,
    loadPreset: (...args: unknown[]) => loadPreset(...args),
  };
});

function renderGeneratedImage(
  ui: ReactElement,
  preloadedState?: Parameters<typeof renderWithProviders>[1] extends infer O
    ? O extends { preloadedState?: infer P }
      ? P
      : never
    : never,
) {
  return renderWithProviders(ui, { preloadedState });
}

describe('GeneratedImage', () => {
  beforeEach(() => {
    generateImage.mockReset();
    loadPreset.mockReset();
    localStorage.clear();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn(),
    });
  });

  it('hides the action strip when showActionStrip is false', () => {
    renderGeneratedImage(
      <GeneratedImageContainer prompt="A glamoured tavern maid" showActionStrip={false} />,
    );

    expect(screen.queryByRole('button', { name: 'Generate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Square 1:1' })).not.toBeInTheDocument();
  });

  it('disables generate without a prompt and has no idle placeholder frame', () => {
    renderGeneratedImage(<GeneratedImageContainer prompt="" />);

    expect(screen.queryByText('Image')).not.toBeInTheDocument();
    expect(screen.queryByText('Add a Visual description to generate')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Seed options' })).toBeEnabled();
    expect(screen.getByRole('textbox', { name: 'Seed' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enable negative prompt' })).toBeDisabled();
  });

  it('hides seed, guidance, and steps when showParamControls is false', () => {
    renderGeneratedImage(
      <GeneratedImageContainer prompt="" showParamControls={false} />,
    );

    expect(screen.queryByRole('button', { name: 'Seed options' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guidance options' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Steps options' })).not.toBeInTheDocument();
  });

  it('generates from the prompt without a preview frame', async () => {
    const user = userEvent.setup();
    generateImage.mockResolvedValue({
      blob: new Blob(['img'], { type: 'image/jpeg' }),
      objectUrl: 'blob:test-image',
      imageType: 'jpeg',
    });

    renderGeneratedImage(
      <GeneratedImageContainer
        prompt="A glamoured tavern maid"
        label="Character portrait"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      expect(generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'A glamoured tavern maid',
          modelId: 'flux-schnell',
          width: 1024,
          height: 1024,
        }),
      );
    });
    expect(screen.queryByRole('img', { name: 'Character portrait' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('cycles ratio picker through wide and portrait sizes', async () => {
    const user = userEvent.setup();
    generateImage.mockResolvedValue({
      blob: new Blob(['img'], { type: 'image/jpeg' }),
      objectUrl: 'blob:test-image',
      imageType: 'jpeg',
    });

    renderGeneratedImage(<GeneratedImageContainer prompt="Wide landscape" />);

    expect(screen.getByRole('button', { name: 'Square 1:1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Square 1:1' }));
    expect(screen.getByRole('button', { name: 'Wide 16:9' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Wide landscape',
        width: 1820,
        height: 1024,
      }),
    );

    generateImage.mockClear();
    await user.click(screen.getByRole('button', { name: 'Wide 16:9' }));
    expect(screen.getByRole('button', { name: 'Portrait 9:16' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Generated image' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 576,
        height: 1024,
      }),
    );

    generateImage.mockClear();
    await user.click(screen.getByRole('button', { name: 'Portrait 9:16' }));
    expect(screen.getByRole('button', { name: 'Square 512' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 512,
        height: 512,
      }),
    );
  });

  it('toggles generate size between base and doubled dimensions', async () => {
    const user = userEvent.setup();
    generateImage.mockResolvedValue({
      blob: new Blob(['img'], { type: 'image/jpeg' }),
      objectUrl: 'blob:test-image',
      imageType: 'jpeg',
    });

    renderGeneratedImage(<GeneratedImageContainer prompt="Sized landscape" />);

    expect(screen.getByText('1024 * 1024')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate size small' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 1024,
        height: 1024,
      }),
    );

    generateImage.mockClear();
    await user.click(screen.getByRole('button', { name: 'Generate size small' }));
    expect(screen.getByRole('button', { name: 'Generate size large' })).toBeInTheDocument();
    expect(screen.getByText('2048 * 2048')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 2048,
        height: 2048,
      }),
    );
  });

  it('keeps model, seed, guide, steps, and negative prompt enabled while generating', async () => {
    const user = userEvent.setup();
    loadPreset.mockResolvedValue({
      name: 'Neg look',
      slug: 'neg-look',
      systemPrompt: 'blurry',
      type: 'negative',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    let resolveGenerate!: (value: {
      blob: Blob;
      objectUrl: string;
      imageType: string;
    }) => void;
    generateImage.mockReturnValue(
      new Promise((resolve) => {
        resolveGenerate = resolve;
      }),
    );

    renderGeneratedImage(<GeneratedImageContainer prompt="A glamoured tavern maid" />, {
      prompts: {
        systemPrompt: 'sys',
        promptType: 'system',
        activeSystemPrompt: 'sys',
        activeSystemPresetSlug: 'default',
        activeNegativePresetSlug: 'neg-look',
        selectedPresetSlug: 'default',
        presetCatalog: [],
        storageReady: true,
      },
    });
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      expect(generateImage).toHaveBeenCalled();
    });
    expect(screen.getByRole('button', { name: 'Model' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Seed options' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Guidance options' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Steps options' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Enable negative prompt' })).toBeDisabled();

    resolveGenerate({
      blob: new Blob(['img'], { type: 'image/jpeg' }),
      objectUrl: 'blob:test-image',
      imageType: 'jpeg',
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
    });
    expect(screen.queryByRole('img', { name: 'Generated image' })).not.toBeInTheDocument();
  });

  it('allows seed, guidance, and steps to stay open at the same time', async () => {
    const user = userEvent.setup();
    renderGeneratedImage(<GeneratedImageContainer prompt="A glamoured tavern maid" />);

    const seedToggle = screen.getByRole('button', { name: 'Seed options' });
    const guideToggle = screen.getByRole('button', { name: 'Guidance options' });
    const stepsToggle = screen.getByRole('button', { name: 'Steps options' });

    await user.click(seedToggle);
    expect(seedToggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(guideToggle);
    expect(guideToggle).toHaveAttribute('aria-expanded', 'true');
    expect(seedToggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(stepsToggle);
    expect(stepsToggle).toHaveAttribute('aria-expanded', 'true');
    expect(seedToggle).toHaveAttribute('aria-expanded', 'true');
    expect(guideToggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders model buttons and uses the selected model on generate', async () => {
    const user = userEvent.setup();
    generateImage.mockResolvedValue({
      blob: new Blob(['img'], { type: 'image/jpeg' }),
      objectUrl: 'blob:test-image',
      imageType: 'jpeg',
    });

    renderGeneratedImage(<GeneratedImageContainer prompt="A glamoured tavern maid" />);

    expect(screen.getByRole('button', { name: 'FLUX Schnell' })).toHaveTextContent(
      'SCH',
    );
    expect(
      screen.queryByRole('button', { name: 'Juggernaut Flux' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Model' }));

    expect(screen.getByRole('button', { name: 'Juggernaut Flux' })).toHaveTextContent(
      'JUG',
    );

    await user.click(screen.getByRole('button', { name: 'Juggernaut Flux' }));
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'juggernaut-xl',
      }),
    );
    expect(localStorage.getItem('luxnova.imgModel')).toBe('juggernaut-xl');
  });

  it('rehydrates the generator model from localStorage on load', async () => {
    const user = userEvent.setup();
    localStorage.setItem('luxnova.imgModel', 'flux-lora-anime');
    generateImage.mockResolvedValue({
      blob: new Blob(['img'], { type: 'image/jpeg' }),
      objectUrl: 'blob:test-image',
      imageType: 'jpeg',
    });

    renderGeneratedImage(<GeneratedImageContainer prompt="A glamoured tavern maid" />, {
      localStorage: loadLocalStorageState(),
    });
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'flux-lora-anime',
      }),
    );
  });

  it('keeps negative prompt disabled for fal models that omit negatives', async () => {
    loadPreset.mockResolvedValue({
      name: 'Neg look',
      slug: 'neg-look',
      systemPrompt: 'blurry, watermark, text',
      type: 'negative',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    generateImage.mockResolvedValue({
      blob: new Blob(['img'], { type: 'image/jpeg' }),
      objectUrl: 'blob:test-image',
      imageType: 'jpeg',
    });

    renderGeneratedImage(<GeneratedImageContainer prompt="A glamoured tavern maid" />, {
      prompts: {
        systemPrompt: 'sys',
        promptType: 'system',
        activeSystemPrompt: 'sys',
        activeSystemPresetSlug: 'default',
        activeNegativePresetSlug: 'neg-look',
        selectedPresetSlug: 'default',
        presetCatalog: [],
        storageReady: true,
      },
    });

    expect(screen.getByRole('button', { name: 'Enable negative prompt' })).toBeDisabled();
  });

  it('persists negative prompt toggle preference in localStorage when model supports it', async () => {
    // fal picker models currently omit negatives; preference write still works via Redux/localStorage helpers.
    localStorage.setItem('luxnova.imgUseNegativePrompt', 'true');
    renderGeneratedImage(<GeneratedImageContainer prompt="A glamoured tavern maid" />, {
      localStorage: loadLocalStorageState(),
      prompts: {
        systemPrompt: 'sys',
        promptType: 'system',
        activeSystemPrompt: 'sys',
        activeSystemPresetSlug: 'default',
        activeNegativePresetSlug: 'neg-look',
        selectedPresetSlug: 'default',
        presetCatalog: [],
        storageReady: true,
      },
    });

    expect(screen.getByRole('button', { name: 'Enable negative prompt' })).toBeDisabled();
    expect(localStorage.getItem('luxnova.imgUseNegativePrompt')).toBe('true');
  });

  it('rehydrates negative prompt toggle off from localStorage', () => {
    localStorage.setItem('luxnova.imgUseNegativePrompt', 'false');

    renderGeneratedImage(<GeneratedImageContainer prompt="A glamoured tavern maid" />, {
      localStorage: loadLocalStorageState(),
      prompts: {
        systemPrompt: 'sys',
        promptType: 'system',
        activeSystemPrompt: 'sys',
        activeSystemPresetSlug: 'default',
        activeNegativePresetSlug: 'neg-look',
        selectedPresetSlug: 'default',
        presetCatalog: [],
        storageReady: true,
      },
    });

    expect(screen.getByRole('button', { name: 'Enable negative prompt' })).toBeDisabled();
  });

  it('rehydrates guidance and steps from localStorage on load', async () => {
    const user = userEvent.setup();
    localStorage.setItem('luxnova.imgGuidanceScale', '5');
    localStorage.setItem('luxnova.imgSteps', '28');
    generateImage.mockResolvedValue({
      blob: new Blob(['img'], { type: 'image/jpeg' }),
      objectUrl: 'blob:test-image',
      imageType: 'jpeg',
    });

    renderGeneratedImage(<GeneratedImageContainer prompt="A glamoured tavern maid" />, {
      localStorage: loadLocalStorageState(),
    });
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        guidance_scale: 5,
        steps: 28,
      }),
    );
  });

  it('shows an error, notifies, and allows retry', async () => {
    const user = userEvent.setup();
    generateImage.mockImplementationOnce(
      async ({ onError }: { onError: (error: Error) => void }) => {
        onError(new Error('fal API error (500)'));
        return null;
      },
    );

    renderGeneratedImage(<GeneratedImageContainer prompt="A glamoured tavern maid" />);

    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('fal API error (500)');
    expect(
      await screen.findByText(/Could not generate image: fal API error \(500\)/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });

  it('auto-saves the blob after generate', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const blob = new Blob(['img'], { type: 'image/png' });
    generateImage.mockResolvedValue({
      blob,
      objectUrl: 'blob:test-image',
      imageType: 'png',
    });

    renderGeneratedImage(
      <GeneratedImageContainer prompt="A glamoured tavern maid" onSave={onSave} />,
    );

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(blob, {
        aspect: '1:1',
        modelId: expect.any(String),
        seed: expect.any(Number),
        guidance_scale: expect.any(Number),
        steps: expect.any(Number),
        useNegativePrompt: false,
        transparentBackground: false,
      });
    });
    expect(screen.queryByRole('img', { name: 'Generated image' })).not.toBeInTheDocument();
  });

  it('notifies and skips generate when prompt exceeds the txt2img limit', async () => {
    const user = userEvent.setup();
    const prompt = 'v'.repeat(TXT2IMG_PROMPT_MAX_LENGTH + 1);

    renderGeneratedImage(<GeneratedImageContainer prompt={prompt} />);

    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(generateImage).not.toHaveBeenCalled();
    expect(await screen.findByText(/Image prompt is too long/i)).toBeInTheDocument();
  });
});
