import { SubHeader } from '../../components/ui/SubHeader';
import styles from './AssetView.module.css';

export function AssetView() {
  return (
    <section className={styles.pane} aria-label="Assets">
      <SubHeader>Assets</SubHeader>
      <div className={styles.body}>
        <p>Sprites and level assets show up here.</p>
      </div>
    </section>
  );
}
