'use strict';
/*
// ViewContent
// Track key page views (ex: product page, landing page or article)
fbq('track', 'ViewContent');

// Search
// Track searches on your website (ex. product searches)
fbq('track', 'Search');

// AddToCart
// Track when items are added to a shopping cart (ex. click/landing page on Add to Cart button)
fbq('track', 'AddToCart');

// AddToWishlist
// Track when items are added to a wishlist (ex. click/landing page on Add to Wishlist button)
fbq('track', 'AddToWishlist');

// InitiateCheckout
// Track when people enter the checkout flow (ex. click/landing page on checkout button)
fbq('track', 'InitiateCheckout');

// AddPaymentInfo
// Track when payment information is added in the checkout flow (ex. click/landing page on billing info)
fbq('track', 'AddPaymentInfo');

// Purchase
// Track purchases or checkout flow completions (ex. landing on "Thank You" or confirmation page)
fbq('track', 'Purchase', {value: '1.00', currency: 'USD'});

// Lead
// Track when a user expresses interest in your offering (ex. form submission, sign up for trial, landing on pricing page)
fbq('track', 'Lead');

// CompleteRegistration
// Track when a registration form is completed (ex. complete subscription, sign up for a service)
fbq('track', 'CompleteRegistration');
*/

/* Controllers */

angular.module('blackFridayApp.controllers', []).
 controller('gameCtrl', ['$scope','$timeout', function($scope,$timeout) {

  $scope.gameRun=true;
  $scope.gameOver=false;
  $scope.levelToLoad=0;
  $scope.maxLevel=14;

  $scope.gamePaused=true;

  $scope.pregame=true;
  $scope.countdown=false;
  $scope.countdownStep=0;

  $scope.gameEdit=true;

  $scope.numLives=3;
  $scope.timesRespawned=1;

  $scope.mapname="";
  $scope.mapdesc="";
  $scope.mapscore=500;
  $scope.maptime=240;

  $scope.gameScore=0;

  $scope.showCtrl="tiles";
  $scope.gameMsg="";

  $scope.tileSet=[];
  $scope.productSet=[];
  $scope.spawnSet=[];
  $scope.objSet=[];
  
  $scope.boardWidth=10;
  $scope.boardHeight=10;
  $scope.boardWidthPending=10;
  $scope.boardHeightPending=10;
  
  $scope.mapSpeed=3;

  $scope.tileArray =[];
  $scope.productArray=[];
  $scope.productMap=[];
  $scope.objMap=[];
  $scope.objArray=[];
  $scope.wobble=0;
  $scope.wobbleRangeHigh=8;
  $scope.wobbleRangeLow=-14;
  $scope.wobbleDir=1;
  $scope.wobbleSpeed=1;



  $scope.spawnArray=[];
  $scope.spawnId=0;
  $scope.productId=0;
  $scope.objId=0;

  $scope.loadStatus=[false,false,false];
  $scope.selectedTool={};
  $scope.drawRotate=90;
  $scope.gameClockCount=0;
  
  $scope.shoplistSet=[];

  $scope.playerObj={};
  $scope.keyPending=null;
  $scope.junkSpent=0;
  $scope.levelTotal=0;
  $scope.levelBudget=1000;

  $scope.levelStruct={};

  $scope.mapLoaded={};
  $scope.shopListTotal=0;

  var gameTimer;
  
  $scope.playerOrigin;
  $scope.number = 5;

  $scope.startStep=0;
  $scope.cashOutIcon=null;
  fbq('track', 'ViewContent');

/*
   PLAY STATE

    STATE_INIT
    STATE_START        
    STATE_TUTORIAL     
    STATE_START
    STATE_RUN
    STATE_CASHOUT
    STATE_GAMEOVER
*/
  
  $scope.getNumber = function(num) {
    return new Array(num);   
  }

  $scope.calcShopTotal=function()
  {
    var total=0;

    for(var i=0;i<$scope.shoplistSet.length;i++)
       {
         total=total+$scope.shoplistSet[i].needed*$scope.shoplistSet[i].cost;
       }
       $scope.shopListTotal=total;
  }

  $scope.saveLevel=function()
  {

    $scope.levelStruct.mapname=$scope.mapname;
    $scope.levelStruct.mapdesc=$scope.mapdesc;
    $scope.levelStruct.mapSpeed=$scope.mapSpeed;

    $scope.levelStruct.tileArray=$scope.tileArray;
    $scope.levelStruct.productArray=$scope.productArray;
    $scope.levelStruct.productMap=$scope.productMap;
    $scope.levelStruct.spawnArray=$scope.spawnArray;

    $scope.levelStruct.objMap=$scope.objMap;
    $scope.levelStruct.objArray=$scope.objArray;

    $scope.levelStruct.spawnId=$scope.spawnId;
    $scope.levelStruct.productId=$scope.productId;
    $scope.levelStruct.shoplistSet=$scope.shoplistSet;
    $scope.levelStruct.playerObj=$scope.playerObj;
    $scope.levelStruct.levelBudget=$scope.levelBudget;
    $scope.levelStruct.boardWidth=$scope.boardWidth;
    $scope.levelStruct.boardHeight=$scope.boardHeight;
    $scope.levelStruct.boardHeightPending=$scope.boardHeightPending;
    $scope.levelStruct.boardWidthPending=$scope.boardWidthPending;

    //console.log("<save> "+angular.toJson($scope.levelStruct));
    console.log("      shoplistSet: "+angular.toJson($scope.shoplistSet));
  }

  $scope.getFileByName=function(fName)
  {
    
  }

  $scope.loadLevel=function()
  {
    var adr = "maps/map"+$scope.levelToLoad+".json";
        var canvas = document.getElementById('boardCanvas');
     var context = canvas.getContext('2d');

     context.clearRect ( 0 , 0 , canvas.width, canvas.height );
     
    $.getJSON( adr,
    {
      format: "json"
    })
    .done(function( data ) {
       // console.log("<loadMap> load:"+adr);
       // console.log("          "+JSON.stringify(data));
       // console.log("          mapname:"+data.mapname);
       // console.log("          mapdesc:"+data.mapdesc);
       $scope.mapLoaded=JSON.parse(JSON.stringify(data));

       $('#boardCanvas').attr('width',(data.boardWidth*50)+'px');
       $('#boardCanvas').attr('height',(data.boardHeight*50)+'px');

       // console.log("        "+data.boardWidth+" x "+data.boardHeight);


       $scope.mapname=data.mapname;
       $scope.mapdesc=data.mapdesc;
       $scope.mapSpeed=data.mapSpeed;
       $scope.tileArray=data.tileArray;
       $scope.productArray=data.productArray;
       $scope.productMap=data.productMap;
       $scope.spawnArray=data.spawnArray;
       $scope.spawnId=data.spawnId;
       $scope.productId=data.productId;
       $scope.shoplistSet=data.shoplistSet;
       $scope.playerObj=data.playerObj;
       $scope.levelBudget=data.levelBudget;
       $scope.boardHeightPending=data.boardHeightPending;
       $scope.boardWidthPending=data.boardWidthPending;
       $scope.boardHeight=data.boardHeight;
       $scope.boardWidth=data.boardWidth;
       $scope.objMap=data.objMap;
       $scope.objArray=data.objArray;
       $scope.objId=data.objArray.length;

       $scope.junkSpent=0;
       $scope.levelTotal=0;
       $scope.drawMap(0,0); 
     
       for(var i=0;i<$scope.shoplistSet.length;i++)
       {
         $scope.shoplistSet[i].inventory=0;
         $scope.shoplistSet[i].spent=0;
        
       }

       for(var i=0;i<$scope.productArray.length;i++)
       {
         $scope.productArray[i].state='new';
         $scope.productArray[i].spawnCnt=0;
       }
       $scope.wobble=0;
        $scope.speedBuff=false;
        $scope.isSale=false;
        $scope.isSlow=false;
        $scope.cashOutIcon=null;

       $scope.calcShopTotal();
       
       $scope.$apply();

       $scope.startCountdown();
       $scope.playSound('readysetshop');
       

      
     })
    .fail(function() {
      console.log( "<init> ERROR load:"+adr );
    });

  }

	     	
  $scope.trapKeypress=function(iVal,kCode)
  {
   var kVal=String.fromCharCode(iVal);
    if($scope.showLevelDialog==true && $scope.gameOver!=true)
    {
      console.log("NEXT-LEVEL");
      $scope.showLevelDialog=false;
      $scope.countdownStep=0;
      $scope.countdown=true;
      $scope.levelToLoad=$scope.levelToLoad+1;
      $scope.loadLevel();  
      
      
    }
    else
    if($scope.playerObj.state=="dead")
    {
      $scope.respawn();
    }
    if($scope.gamePaused==false)
    {  
     switch(kCode)
     { 
       case 38: { kVal='w'; break; }
       case 37: { kVal='a'; break; }
       case 39: { kVal='d'; break; }
       case 40: { kVal='s'; break; }
     }
    	$scope.keyPending=kVal;
  	}
  }
  
  $scope.procKeypress=function()
  {	
  	var kVal=$scope.keyPending;


    if($scope.playerObj.state!=='dead')
    {
    	switch(kVal)
    	{
    		case 'W':
    		case 'w':
    		{ $scope.playerObj.rotate=0;
          var canMove=$scope.playerCheck();
          if(canMove) { $scope.playerObj.stopped=false; }
    		  break;
    		}
        case 'A':
    		case 'a':
    		{ $scope.playerObj.rotate=270; 
    		  var canMove=$scope.playerCheck();
          if(canMove) { $scope.playerObj.stopped=false; }
    		  break;
    		}
        case 'D':
    		case 'd':
    		{ $scope.playerObj.rotate=90;
    		  var canMove=$scope.playerCheck();
          if(canMove) { $scope.playerObj.stopped=false; }
          break;
    		}
        case 'S':
    		case 's':
    		{ $scope.playerObj.rotate=180;
    		  var canMove=$scope.playerCheck();
          if(canMove) { $scope.playerObj.stopped=false; }
          break;
    		}
    		case 'x':
        case 'X':
    		{ $scope.state='stop';
    		  $scope.playerObj.stopped=true;
    		  break;
    		}
        case ' ':
        {
            $scope.playerObj.stopped=true;
            $scope.playerObj.shopping=true;
            $scope.playerObj.shopCnt=0;
            $scope.playerObj.img=$scope.playerObj.shop;
            $scope.playerShop();
            break;
        }
    	}
    }
  	$scope.keyPending=null;
  //	$scope.$apply();
  }


  $scope.prodSrc=function(id)
  {
    return "sprites/product"+id+".png";
  }


  $scope.playerBuy=function(id,undertile)
  {
    var costFactor=1;
    
    if( $scope.isSale==true ) { 
      costFactor=$scope.saleAmmount; 
      $scope.playSound('sale');
    }

    for(var i=0;i<$scope.productArray.length;i++)
    {
      if(id==$scope.productArray[i].id && $scope.productArray[i].state!='respawn')
        { $scope.productArray[i].spawnCnt=0;
          $scope.productArray[i].state='respawn'; 
          var productBought=$scope.productArray[i];
          
          for(var j=0;j<$scope.shoplistSet.length;j++)
          {
           // console.log($scope.shoplistSet[j].name+" = "+productBought.name);
            if($scope.shoplistSet[j].name==productBought.name)
            {
              if($scope.shoplistSet[j].needed>0 && $scope.shoplistSet[j].inventory<$scope.shoplistSet[j].needed)
              {
              //  console.log("IS ON LIST");
                $scope.shoplistSet[j].inventory++;
                $scope.shoplistSet[j].spent+=parseInt(productBought.cost * costFactor);
                $scope.levelTotal+=parseInt(productBought.cost * costFactor);
              }
              else
              { 
               // console.log("IS JUNK");
                $scope.junkSpent+=productBought.cost;
                $scope.levelTotal+=productBought.cost;
              }
              
            }

          }


        }
    }


  }

  $scope.playerShop=function()
  {
      var thisTile=$scope.tileArray[$scope.playerObj.posObj.tileX][$scope.playerObj.posObj.tileY];
      $scope.playSound('shop');

      //console.log("SHOP: "+$scope.playerObj.posObj.tileX+","+$scope.playerObj.posObj.tileY+"   thisTile:"+thisTile);
    
      var aboveTile=$scope.productMap[$scope.playerObj.posObj.tileX][$scope.playerObj.posObj.tileY-1];
      var belowTile=$scope.productMap[$scope.playerObj.posObj.tileX][$scope.playerObj.posObj.tileY+1];
      var leftTile=$scope.productMap[$scope.playerObj.posObj.tileX-1][$scope.playerObj.posObj.tileY];
      var rightTile=$scope.productMap[$scope.playerObj.posObj.tileX+1][$scope.playerObj.posObj.tileY];

      // console.log(' |'+aboveTile+'|');
      // console.log(leftTile+"| |"+rightTile);
      // console.log(' |'+belowTile+'|');
      var isBuy=false;

      switch($scope.playerObj.rotate)
      {
        case 0:
        { if(aboveTile!=null) { isBuy=true; $scope.playerBuy(aboveTile,$scope.tileSet[thisTile]); }
          break;
        }
        case 90:
        { if(rightTile!=null) { isBuy=true; $scope.playerBuy(rightTile,$scope.tileSet[thisTile]); }
          break;
        }
        case 180:
        { if(belowTile!=null) { isBuy=true; $scope.playerBuy(belowTile,$scope.tileSet[thisTile]); }
          break;
        }
        case 270:
        { if(leftTile!=null) { isBuy=true; $scope.playerBuy(leftTile,$scope.tileSet[thisTile]); }
          break;
        }
      }


  }

  $scope.stateShop=function(tObj)
  {
  	var rNum=Math.floor(Math.random() * 10);
  	if(rNum<tObj.buy)
  	{
 	 
      var thisTile=$scope.productMap[tObj.posObj.tileX][tObj.posObj.tileY];
      var aboveTile=$scope.productMap[tObj.posObj.tileX][tObj.posObj.tileY-1];
      var belowTile=$scope.productMap[tObj.posObj.tileX][tObj.posObj.tileY+1];
      var leftTile=$scope.productMap[tObj.posObj.tileX-1][tObj.posObj.tileY];
      var rightTile=$scope.productMap[tObj.posObj.tileX+1][tObj.posObj.tileY];

  	 var decideArray=[];
  	 	if(aboveTile!=null) { decideArray.push('above');  }
  	 	if(belowTile!=null) { decideArray.push('below');  }
  	 	if(leftTile!=null)  { decideArray.push('left');  }
  	 	if(rightTile!=null) { decideArray.push('right');  }
 if(decideArray.length>0)
 {
  	var rRoll=Math.floor(Math.random() * decideArray.length);
 	
  	 // console.log(' |'+aboveTile+'|');
   	//  console.log(leftTile+"| |"+rightTile);
   	//  console.log(' |'+belowTile+'|');

   	switch(decideArray[rRoll])
  	 	{
  	 		case 'above':
  	 		{
  	 			$scope.buyProduct(aboveTile);
  	 			break;
  	 		}
  	 		case 'below':
  	 		{
  	 			$scope.buyProduct(belowTile);
  	 			break;
  	 		}
  	 		case 'left':
  	 		{
  	 			$scope.buyProduct(leftTile);
  	 			break;
  	 		}
  	 		case 'right':
  	 		{
  	 			$scope.buyProduct(rightTile);
  	 			break;
  	 		}

  	 	}
  	  }
 	}
  }
  	 
  $scope.buyProduct=function(id)
  {	
	
  	for(var i=0;i<$scope.productArray.length;i++)
    {
    	if(id==$scope.productArray[i].id && $scope.productArray[i].state!='respawn')
    		{ $scope.productArray[i].spawnCnt=0;
    		  $scope.productArray[i].state='respawn'; 
    		}
    }
  }

  $scope.procProduct=function()
  {	
	
  	for(var i=0;i<$scope.productArray.length;i++)
    {
    	if($scope.productArray[i].state=='respawn')
		{
			if($scope.productArray[i].spawnCnt<$scope.productArray[i].spawn)
	    	{
	    		$scope.productArray[i].spawnCnt++;
	    	}
	    	else
	    	{ 
	    		$scope.productArray[i].spawnCnt=0;
	    		$scope.productArray[i].state='new'; 
	    	}
	    	
	    }
    }

  }

  $scope.playerCheck=function()
  {
    var tObj=$scope.playerObj;
    var isSafe=true;

    var aboveTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY-1]];
    var belowTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY+1]];
    var leftTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX-1][tObj.posObj.tileY]];
    var rightTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX+1][tObj.posObj.tileY]];

    switch($scope.playerObj.rotate)
    {
      case 0:
      {
        if(aboveTile.speed<1) { isSafe=false; }
        break;
      }
      case 90:
      {
        if(rightTile.speed<1) { isSafe=false; }
        break;
      }
      case 180:
      {
        if(belowTile.speed<1) { isSafe=false; }
        break;
      }
      case 270:
      {
        if(leftTile.speed<1) { isSafe=false; }
        break;
      }

    }
    return isSafe;
  }

  $scope.playerSlide=function()
  {
    $scope.playSound('slide');

    var tObj=$scope.playerObj;

      var aboveTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY-1]];
      var belowTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY+1]];
      var leftTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX-1][tObj.posObj.tileY]];
      var rightTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX+1][tObj.posObj.tileY]];

    var decideArray=[];
    if(aboveTile.speed>0 && $scope.playerObj.rotate!=0 ) { decideArray.push('above'); }
    if(belowTile.speed>0 && $scope.playerObj.rotate!=180 ) { decideArray.push('below'); }
    if(leftTile.speed>0 && $scope.playerObj.rotate!=270 ) { decideArray.push('left'); }
    if(rightTile.speed>0 && $scope.playerObj.rotate!=90 ) { decideArray.push('right'); }
     var rNum=Math.floor(Math.random() * decideArray.length);
     switch(decideArray[rNum])
     {
        case 'above': { $scope.playerObj.rotate=0; break; }
        case 'right': { $scope.playerObj.rotate=90; break; }
        case 'below': { $scope.playerObj.rotate=180; break; }
        case 'left': { $scope.playerObj.rotate=270; break; }

     }

  }

  $scope.saleStyle=function()
  {

    return 'width:'+$scope.saleTime+" px";
  }      


  $scope.playerDecide=function(tObj)
  {

  	 tObj.posObj.offsetX=0;
  	 tObj.posObj.offsetY=0;

      var thisTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY]];
      var aboveTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY-1]];
      var belowTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY+1]];
      var leftTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX-1][tObj.posObj.tileY]];
      var rightTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX+1][tObj.posObj.tileY]];

     var thisObjNum=$scope.objMap[tObj.posObj.tileX][tObj.posObj.tileY];
     var thisObj=$scope.objArray[thisObjNum];

  	 var isBlocked=false;
     if(thisObj)
     {
       switch(thisObj.actAs)
       {
          case 'speed': 
          { 
            if($scope.playerObj.speedBuff!=true)
            {
              $scope.playerObj.speedBuff=true;
              if(!$scope.playerObj.buffCtr) { $scope.playerObj.buffCtr=0; }
              $scope.playerObj.buffCtr=100;
              $scope.playerObj.ammount=thisObj.ammount;
              $scope.playSound('speed');
            }
            break; }
          case 'register': { 
            $scope.cashOut();

            break; }
          case 'sale' : {
            if(!$scope.isSale)
            {
              $scope.isSale=true;
              $scope.saleTime=100;
              $scope.playSound('sale',thisObj.ammount);
              
            }
            $scope.saleStr="SALE "+(thisObj.ammount*100)+"% OFF!";
            $scope.saleAmmount=thisObj.ammount;

            break;
          }
          case 'slide': { 
            $scope.stateDecide($scope.playerObj);
            $scope.playSound('slide');
            $scope.playerSlide(); break; }
          case 'slow': {
            if(!$scope.isSlow)
            {
              if($scope.isSlow!=true)
              { $scope.playSound('slow'); }

              $scope.isSlow=true;
              $scope.slowTime=100;

            }
            break;

          }

       }
      }


  	 $scope.procKeypress();

   	 // console.log(' |'+aboveTile.speed+'|');
   	 // console.log(leftTile.speed+"| |"+rightTile.speed);
   	 // console.log(' |'+belowTile.speed+'|');

  	 switch(tObj.rotate)
  	 {
  	 	case 0:
  	 	{ 
  	 		if(aboveTile.speed==0)
  	 			{ isBlocked=true; }
  	 		
  	 		break;
  	 	}
  	 	case 90:
  	 	{ 
  	 		if(rightTile.speed==0)
  	 			{ isBlocked=true;}
  	 		
  	 		break;
  	 	}
  	 	case 180:
  	 	{ 
  	 		if(belowTile.speed==0)
  	 			{ isBlocked=true;}
  	 		break;
  	 	}
  	 	case 270:
  	 	{ 
  	 		if(leftTile.speed==0)
  	 			{ isBlocked=true;}
  	 		break;
  	 	}
  	 }

  	// console.log("<playerDecide> "+JSON.stringify(tObj));
  	// console.log("<playerDecide> isBlocked="+isBlocked);
  	 if(isBlocked==true)
  	 	{ tObj.state="stop"; }
  	 else
  	 	{ tObj.state="moving"; }
  	 
  }

  $scope.stateDecide=function(tObj)
  {
  	$scope.stateShop(tObj);

  	 // console.log("   <stateDecide> "+JSON.stringify(tObj)); 
  	 // console.log("       tileArray "+$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY]);

  	 var thisTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY]];
  	 var aboveTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY-1]];
	 var belowTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX][tObj.posObj.tileY+1]];
	 var leftTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX-1][tObj.posObj.tileY]];
  	 var rightTile=$scope.tileSet[$scope.tileArray[tObj.posObj.tileX+1][tObj.posObj.tileY]];
  	 
  // 	 console.log(' |'+aboveTile.speed+'|');
  // 	 console.log(leftTile.speed+"| |"+rightTile.speed);
  // 	 console.log(' |'+belowTile.speed+'|');
  	 var isBlocked=false;
  	 switch(tObj.rotate)
  	 {
  	 	case 0:
  	 	{ 
  	 		if(aboveTile.speed==0)
  	 			{ isBlocked=true; }
  	 		
  	 		break;
  	 	}
  	 	case 90:
  	 	{ 
  	 		if(rightTile.speed==0)
  	 			{ isBlocked=true;}
  	 		
  	 		break;
  	 	}
  	 	case 180:
  	 	{ 
  	 		if(belowTile.speed==0)
  	 			{ isBlocked=true;}
  	 		break;
  	 	}
  	 	case 270:
  	 	{ 
  	 		if(leftTile.speed==0)
  	 			{ isBlocked=true;}
  	 		break;
  	 	}
  	 }
  	 var rNum=Math.floor(Math.random() * 10);
  	 var isRandom=false;

  	 if(rNum<tObj.random)
  	 	{ isRandom=true; }


  	// console.log(' ..... isBlocked='+isBlocked+"    "+tObj.random+" ... "+rNum+" : "+isRandom);
  	 

  	 if(isBlocked==true || isRandom==true)
  	 {

  	 	var decideArray=[];
  	 	if(aboveTile.speed>0) { decideArray.push('above');  }
  	 	if(belowTile.speed>0) { decideArray.push('below');  }
  	 	if(leftTile.speed>0)  { decideArray.push('left');  }
  	 	if(rightTile.speed>0) { decideArray.push('right');  }



  	 	//console.log('   decide from '+JSON.stringify(decideArray));
  	 	var rRoll=Math.floor(Math.random() * decideArray.length);
  	 	//console.log('   decision is '+decideArray[rRoll]);

  	 	switch(decideArray[rRoll])
  	 	{
  	 		case 'above':
  	 		{
  	 			tObj.rotate=0;
  	 			tObj.posObj.offsetX=0;
  	 			tObj.posObj.offsetY=0;
  	 			
  	 			break;
  	 		}
  	 		case 'below':
  	 		{
  	 			tObj.rotate=180;
  	 			tObj.posObj.offsetX=0;
  	 			tObj.posObj.offsetY=0;
  	 			
  	 			break;
  	 		}
  	 		case 'left':
  	 		{
  	 			tObj.rotate=270;
  	 			tObj.posObj.offsetX=0;
  	 			tObj.posObj.offsetY=0;
  	 			
  	 			break;
  	 		}
  	 		case 'right':
  	 		{
  	 			tObj.rotate=90;
  	 			tObj.posObj.offsetX=0;
  	 			tObj.posObj.offsetY=0;
  	 			
  	 			break;
  	 		}

  	 	}

  	 }
  }

  $scope.checkColide=function(spawnPos,id)
  {
    var playerPos=$scope.playerObj.posObj;

    var px1=(playerPos.tileX*50)+playerPos.offsetX;
    var px=px1+25;

    var py1=(playerPos.tileY*50)+playerPos.offsetY;
    var py=py1+25;

    var sx1=(spawnPos.tileX*50)+spawnPos.offsetX;
    var sx=sx1+25;

    var sy1=(spawnPos.tileY*50)+spawnPos.offsetY;
    var sy=sy1+25;
   // console.log("("+px+","+py+")   ("+sx+","+sy+")");

    if( (px>sx-25) && (px<sx+25) && (py>sy-25) && (py<sy+25) && $scope.playerObj.state!='dead')
      { console.log('colide '+angular.toJson(id));
        $scope.playerObj.img=$scope.playerObj.dead;
        $scope.playerObj.state='dead';
        $scope.playSound('kill',id.name);
        $scope.$apply();
      }
  }

   $scope.respawn=function()
  {
      $scope.timesRespawned++;
        $scope.showLevelDialog=false;
      $scope.countdownStep=0;
      $scope.countdown=true;
      $scope.isSlow=false;
      $scope.gamePaused=true;
      $scope.loadLevel();
        
       
       
  }

  $scope.stepSpawns=function()
  {
  	//console.log("<stepSpawns> "+$scope.gameClockCount);

  	for(var i=0;i<$scope.spawnArray.length;i++)
  	{
  		var tObj=$scope.spawnArray[i]
       

  	  $scope.checkColide( $.extend({}, tObj.posObj, true),tObj );
    	//tObj.posObj.tileX++;
  		switch($scope.spawnArray[i].state)
  		{
  			case 'new':
  			{ //console.log('new >>>'); 
  			  tObj.posObj.offsetX=0;
  			  tObj.posObj.offsetY=0;
  			  $scope.spawnArray[i].state='moving';
          $scope.stateDecide(tObj);
  			  break;	
  			}
  			case 'moving':
  			{ //console.log("moving >>> "+i+"  "+JSON.stringify(tObj.posObj)+"  "+tObj.state+"  "+tObj.rotate);
         var spd=tObj.speed;
         if($scope.slowTime>0 && $scope.isSlow)
          { spd=spd/4; }

  			 switch(tObj.rotate)
  			  {
  			  	case 0: 
  			  	{  tObj.posObj.offsetY= tObj.posObj.offsetY- spd; 
  			  		if(tObj.posObj.offsetY<-50)
  			  		{
  			  			
  			  			tObj.posObj.offsetY=tObj.posObj.offsetY+50;
  			  			tObj.posObj.tileY=tObj.posObj.tileY-1;
  			  			$scope.stateDecide(tObj);
  			  			
  			  		}
  			  	   break; }
  			  	case 90: 
  			  	{  tObj.posObj.offsetX= tObj.posObj.offsetX+ spd; 
					if(tObj.posObj.offsetX>50)
  			  		{
  			  			
  			  			tObj.posObj.offsetX=tObj.posObj.offsetX-50;
  			  			tObj.posObj.tileX=tObj.posObj.tileX+1;
  			  			$scope.stateDecide(tObj);
  			  		}
  			  	   break; }
  			  	case 180: {  tObj.posObj.offsetY= tObj.posObj.offsetY+ spd;
					if(tObj.posObj.offsetY>50)
  			  		{
  			  			
  			  			tObj.posObj.offsetY=tObj.posObj.offsetY-50;
  			  			tObj.posObj.tileY=tObj.posObj.tileY+1;
  			  			$scope.stateDecide(tObj);
  			  		}
  			  	   break; }
  			  	case 270: {  tObj.posObj.offsetX= tObj.posObj.offsetX- spd; 
					if(tObj.posObj.offsetX<-50)
  			  		{
  			  			
  			  			tObj.posObj.offsetX=tObj.posObj.offsetX+50;
  			  			tObj.posObj.tileX=tObj.posObj.tileX-1;
  			  			$scope.stateDecide(tObj);
  			  		}
  			  	   break; }
  			  }
  			  break;	
  			}


  		}


  	}
  	
  }

  $scope.stepPlayer=function()
  {
  	
  	
	var tObj=$scope.playerObj;
  if ($scope.isSale)
    { $scope.saleTime=$scope.saleTime-1; 
      if($scope.saleTime==0)
        { $scope.isSale=false; }
    }

     if ($scope.isSlow)
    { $scope.slowTime=$scope.slowTime-1; 
      if($scope.slowTime==0)
        { $scope.isSlow=false; }
    }
  
   if( tObj.speedBuff==true)
   {
      if(tObj.buffCtr>0)
      {
        tObj.buffCtr=tObj.buffCtr-1;
      }
      else
      {
        tObj.speedBuff=false;
      }
   }
   var spd=parseInt(tObj.speed);
   if(tObj.speedBuff==true)
    { spd=spd*tObj.ammount; }
   

//	console.log("<stepPlayer> "+JSON.stringify($scope.playerObj));
   if(tObj.shopping==true)
  {
    if($scope.playerObj.shopCnt<5)
      { 
        $scope.playerObj.shopCnt++;
      }
    else
      { tObj.shopping=false;
        $scope.playerObj.img=$scope.playerObj.file; }
  }
  else
  if(tObj.stopped==true)
  	{ $scope.procKeypress(); }
  else
  {
	//tObj.posObj.tileX++;
	switch(tObj.state)
	{

    case 'dead':
    { 
      $scope.procKeypress();
      break;  
    }

		case 'new':
		{ $scope.playerDecide(tObj);
      tObj.posObj.offsetX=0;
		  tObj.posObj.offsetY=0;
		  tObj.state='moving';

		  break;	
		}
		case 'stop':
		{ $scope.playerDecide(tObj);
		  break;
		}
		case 'moving':
		{
		 //console.log("moving >>>   "+JSON.stringify(tObj.posObj)+"  "+tObj.state+"  "+tObj.rotate);
       
  		 switch(tObj.rotate)
  		  {
  		  	case 0: 
  		  	{  tObj.posObj.offsetY= tObj.posObj.offsetY- spd; 
    		  		if(tObj.posObj.offsetY<-50)
    		  		{
    		  			
    		  			tObj.posObj.offsetY=tObj.posObj.offsetY+50;
    		  			tObj.posObj.tileY=tObj.posObj.tileY-1;
    		  			$scope.playerDecide(tObj);
    		  			
    		  		}
  		  	   break; }
  		  	case 90: 
  		  	{  tObj.posObj.offsetX= tObj.posObj.offsetX+ spd; 
      			if(tObj.posObj.offsetX>50)
      		  		{
      		  			
      		  			tObj.posObj.offsetX=tObj.posObj.offsetX-50;
      		  			tObj.posObj.tileX=tObj.posObj.tileX+1;
      		  			$scope.playerDecide(tObj);
      		  		}
  		  	   break; }
  		  	case 180: {  tObj.posObj.offsetY= tObj.posObj.offsetY+ spd;
      			if(tObj.posObj.offsetY>50)
      		  		{
      		  			
      		  			tObj.posObj.offsetY=tObj.posObj.offsetY-50;
      		  			tObj.posObj.tileY=tObj.posObj.tileY+1;
      		  			$scope.playerDecide(tObj);
      		  		}
  		  	   break; }
  		  	case 270: {  tObj.posObj.offsetX= tObj.posObj.offsetX- spd; 
      			if(tObj.posObj.offsetX<-50)
      		  		{
      		  			
      		  			tObj.posObj.offsetX=tObj.posObj.offsetX+50;
      		  			tObj.posObj.tileX=tObj.posObj.tileX-1;
      		  			$scope.playerDecide(tObj);
      		  		}
  		  	   break; }
  		  }
  		  break;	
  		}


  	}

   }  	
  }

  $scope.styleShopList=function(sItem)
  {
    if(sItem.inventory<sItem.needed) {
      return { 'text-decoration': 'none' };
    }
    else {
       return { 'text-decoration': 'line-through' };
    }

  }

  $scope.boardStyle=function()
  {
  	return { 'width':($scope.boardWidth*50)+'px',
  			 'height':($scope.boardHeight*50)+'px',
  			 'backgroundColor': '#ddddff' }
  }

  $scope.productStyle=function(sObj)
  {
  	if(!sObj.posObj.offsetX)
  		{ sObj.posObj.offsetX=0; }
  	if(!sObj.posObj.offsetY)
  		{ sObj.posObj.offsetY=0; }

  	var xPos=(sObj.posObj.tileX*50)+sObj.posObj.offsetX+20;
  	var yPos=(sObj.posObj.tileY*50)+sObj.posObj.offsetY;
	  var opc=1;
	if(sObj.state=='respawn')
	{ opc=.15; }

  	return { 'position':'absolute',
  			 'width':'50px',
  			 'height':'50px',
  			 'top':yPos,
  			 'left':xPos ,
			 'opacity':opc
  			}

  }

  $scope.objStyle=function(sObj)
  {
    if(!sObj.posObj.offsetX)
      { sObj.posObj.offsetX=0; }
    if(!sObj.posObj.offsetY)
      { sObj.posObj.offsetY=0; }

    var xPos=(sObj.posObj.tileX*50)+sObj.posObj.offsetX+20;
    var yPos=(sObj.posObj.tileY*50)+sObj.posObj.offsetY;
    var opc=1;
  if(sObj.state=='respawn')
  { opc=.15; }

    return { 'position':'absolute',
         'width':'50px',
         'height':'50px',
         'top':yPos,
         'left':xPos ,
       'opacity':opc
        }

  }


  $scope.playerStyle=function()
  {


  	var sObj=$scope.playerObj;
  	if(!sObj.posObj)
  		{ sObj.posObj={}; }
  	if(!sObj.posObj.offsetX)
  		{ sObj.posObj.offsetX=0; }
  	if(!sObj.posObj.offsetY)
  		{ sObj.posObj.offsetY=0; }

  	var xPos=(sObj.posObj.tileX*50)+sObj.posObj.offsetX+20;
  	var yPos=(sObj.posObj.tileY*50)+sObj.posObj.offsetY;
	var opc=1;


	   var rot=sObj.rotate+$scope.wobble;
    


  	return { 'position':'absolute',
  			 'width':'50px',
  			 'height':'50px',
  			 'top':yPos,
  			 'left':xPos ,
         'z-index':1,
  			 '-ms-transform': 'rotate('+rot+'deg)', /* IE 9 */
			   '-webkit-transform': 'rotate('+rot+'deg)', /* Chrome, Safari, Opera */
			   'transform': 'rotate('+rot+'deg)'
  			}
  }

  $scope.cashOutStyle=function()
  {


    var sObj=$scope.playerObj;
    if(!sObj.posObj)
      { sObj.posObj={}; }
    if(!sObj.posObj.offsetX)
      { sObj.posObj.offsetX=0; }
    if(!sObj.posObj.offsetY)
      { sObj.posObj.offsetY=0; }

    var xPos=(sObj.posObj.tileX*50)+sObj.posObj.offsetX+20;
    var yPos=(sObj.posObj.tileY*50)+sObj.posObj.offsetY;
  var opc=1;


     var rot=sObj.rotate+$scope.wobble;
    


    return { 'position':'absolute',
         'width':'50px',
         'height':'50px',
         'top':yPos,
         'left':xPos ,
         'z-index':2
        }
  }



  $scope.spawnStyle=function(sObj)
  {
  	if(!sObj.posObj.offsetX)
  		{ sObj.posObj.offsetX=0; }
  	if(!sObj.posObj.offsetY)
  		{ sObj.posObj.offsetY=0; }

  	var xPos=(sObj.posObj.tileX*50)+sObj.posObj.offsetX+20;
  	var yPos=(sObj.posObj.tileY*50)+sObj.posObj.offsetY;
	
  	return { 'position':'absolute',
  			 'width':'50px',
  			 'height':'50px',
  			 'top':yPos,
  			 'left':xPos ,
          'z-index':2,
			 '-ms-transform': 'rotate('+sObj.rotate+'deg)', /* IE 9 */
			 '-webkit-transform': 'rotate('+sObj.rotate+'deg)', /* Chrome, Safari, Opera */
			 'transform': 'rotate('+sObj.rotate+'deg)'
  			}

  }

  $scope.setDrawRotate=function()
  {
  	$scope.drawRotate=$scope.drawRotate+90;
  	if($scope.drawRotate>=360)
  		{ $scope.drawRotate=0; }
  }

  $scope.spawnBtStyle=function(sObj)
  {
 // 	console.log("<spawnBtStyle> "+JSON.stringify(sObj));
  	return { 
  		'-ms-transform': 'rotate('+$scope.drawRotate+'deg)', /* IE 9 */
    	'-webkit-transform': 'rotate('+$scope.drawRotate+'deg)', /* Chrome, Safari, Opera */
    	'transform': 'rotate('+$scope.drawRotate+'deg)' }

  }

  $scope.btStyle=function(btObj)
  {

  	if($scope.showCtrl=="tiles")
    {
    	if(btObj.active==true)
    	{ return { 'backgroundColor': '#ddddff' } }
    	else
    	{ return { 'backgroundColor': '#ffffff' } }
    }
  	
  }

  $scope.selectTool=function(tType,tTool)
  {
 	$scope.selectedTool.active=false;
  	$scope.selectedTool=tTool;
  	$scope.selectedTool.active=true;
  //  console.log("<selectTool> selectedTool="+tType+"   "+JSON.stringify($scope.selectedTool));
  }


  $scope.loadPlayersSet=function()
  {
  	  var adr = "datasource/players.json";
	  $.getJSON( adr,
	  {
	    format: "json"
	  })
	  .done(function( data ) {
	    // console.log("<loadPlayersSet> load:"+adr);
	     $scope.playersSet = $.extend([], data, true);


	  	// console.log("<loadPlayerSet> "+JSON.stringify($scope.playersSet));
	     $scope.$apply(); 

	   })
	  .fail(function() {
	    console.log( "<loadPlayersSet> ERROR load:"+adr );
	  });
  }


  $scope.loadSpawnSet=function()
  {
  	  var adr = "datasource/spawns.json";
	  $.getJSON( adr,
	  {
	    format: "json"
	  })
	  .done(function( data ) {
	    //console.log("<loadSpawnSet> load:"+adr);
	    
	     $scope.spawnSet = $.extend([], data, true);
	  	
	  	 $scope.$apply(); 

	   })
	  .fail(function() {
	    console.log( "<loadSpawnSet> ERROR load:"+adr );
	  });
  }

  $scope.loadObjSet=function()
  {
      var adr = "datasource/objs.json";
    $.getJSON( adr,
    {
      format: "json"
    })
    .done(function( data ) {
      // console.log("<loadObjSet> load:"+angular.toJson(data));
      
       $scope.objSet = $.extend([], data, true);
      
       $scope.$apply(); 

     })
    .fail(function() {
      console.log( "<loadObjSet> ERROR load:"+adr );
    });
  }

  $scope.loadProductSet=function()
  {
  	  var adr = "datasource/products.json";
	  $.getJSON( adr,
	  {
	    format: "json"
	  })
	  .done(function( data ) {
	    // console.log("<loadProductSet> load:"+adr);
	    
	     $scope.productSet = $.extend([], data, true);
	     for(var i=0;i<$scope.productSet.length;i++)
	     {
	     	 var sObj={};
         sObj.name=$scope.productSet[i].name;
         sObj.cost=$scope.productSet[i].cost;
         sObj.file=$scope.productSet[i].file;
	     	 sObj.needed=0;
	     	 sObj.inventory=0;
	     	 sObj.spent=0;
         
			   $scope.shoplistSet.push(sObj);
	     }
	    // console.log("<loadProductSet> "+JSON.stringify( $scope.shoplistSet ))
	  	 //$scope.$apply();  
	   })
	  .fail(function() {
	    console.log( "<loadProductSet> ERROR load:"+adr );
	  });
  }


  
   $scope.loadTileSet=function()
  {
  	  var adr = "datasource/struct.json";
	  $.getJSON( adr,
	  {
	    format: "json"
	  })
	  .done(function( data ) {
	    
	     $scope.tileSet = $.extend([], data, true);
	  	 $scope.createEmptyMap();
	  	 $scope.$apply();  
	   })
	  .fail(function() {
	    console.log( "<init> ERROR load:"+adr );
	  });

  }

  $scope.getTile=function(c,r)
  {
  //	console.log("<getTile> "+r+","+c+"  "+ $scope.tileArray[r][c]);
  	return $scope.tileArray[r][c];
  }


  $scope.drawMapTile=function(x,y)
  {
  	var canvas = document.getElementById('boardCanvas');
  	 var context = canvas.getContext('2d');
  	 var imageObj = new Image();

  	imageObj.onload = function() 
		{ context.drawImage(imageObj, x*50, y*50); };
	  imageObj.src = $scope.tileSet[$scope.tileArray[x][y]].file;
  }

  $scope.drawMap=function(x,y)
  {
  	
  	var canvas = document.getElementById('boardCanvas');
  	 var context = canvas.getContext('2d');


  	 var imageObj = new Image();

	imageObj.onload = function() 
		{ context.drawImage(imageObj, x*50, y*50);
		  if(x<$scope.boardWidth-1)
		  	{ x++; 	
		  	  $scope.drawMap(x,y); }
		  else
		  if(y<$scope.boardHeight-1)
		  	{ x=0;
              y++;
              $scope.drawMap(x,y);
		  	}
		  
		};
	  imageObj.src = $scope.tileSet[$scope.tileArray[x][y]].file;
	 

  }




  $scope.clickProduct=function(pObj)
  { 
    for(var i=0;i<$scope.productArray.length;i++)
    {
    	if(pObj.id==$scope.productArray[i].id)
    		{ 
    		  $scope.productMap[$scope.productArray[i].posObj.tileX][$scope.productArray[i].posObj.tileY]=null;
    		  $scope.productArray.splice(i,1);
    		}
    }



  }


  $scope.boardClick=function($event)
  {
    if(!$scope.gameRun)
    {
    	var posObj={};
    	posObj.x = $event.pageX - $('#gameBoard').offset().left
      posObj.y = $event.pageY - $('#gameBoard').offset().top

      posObj.tileX=Math.floor(posObj.x / 50);
      posObj.tileY=Math.floor(posObj.y / 50);
      var sTool=$scope.selectedTool.id;

      console.log("<$scope.showCtrl> "+$scope.showCtrl);

  	if(!sTool)
  		{ sTool=0; }

      if($scope.showCtrl=="tiles")
      {
  		$scope.tileArray[posObj.tileX][posObj.tileY]=sTool;
  		$scope.drawMapTile(posObj.tileX,posObj.tileY);
  	}
  	else
  	if($scope.showCtrl=="products")
  	{
  		console.log("<products> "+$scope.productSet[sTool].name);
  		
  		if($scope.productSet[sTool].name=='Random')
  		{
  			sTool=Math.floor(Math.random() * ($scope.productSet.length-1));
  		}

  		var sObj=$.extend({}, $scope.productSet[sTool], true);
  		sObj.id=$scope.productId;
  		sObj.state='new';
  		$scope.productId++;
      sObj.posObj=posObj;
         
      $scope.productArray.push(sObj);
  	  $scope.productMap[sObj.posObj.tileX][sObj.posObj.tileY]=sObj.id;
  	}
    else
    if($scope.showCtrl=="objs")
    {
      console.log("<objs> "+$scope.objSet[sTool].name);
      
      if($scope.objSet[sTool].name=='Random')
      {
        sTool=Math.floor(Math.random() * ($scope.objSet.length-1));
      }

      var sObj=$.extend({}, $scope.objSet[sTool], true);
      sObj.id=$scope.objId;
      sObj.state='new';
      $scope.objId++;
      sObj.posObj=posObj;
         
      $scope.objArray.push(sObj);
      $scope.objMap[sObj.posObj.tileX][sObj.posObj.tileY]=sObj.id;

      console.log("<objArray> "+angular.toJson($scope.objArray));
      console.log("<objMap> "+angular.toJson($scope.objArray))
    }
  	else
  	if($scope.showCtrl=="spawns")
  	{
  		var sObj=$.extend({}, $scope.spawnSet[sTool], true);
  		sObj.id=$scope.spawnId;
  		sObj.state='new';
  		$scope.spawnId++;
          sObj.posObj=posObj;
          sObj.rotate=$scope.drawRotate;

          $scope.spawnArray.push(sObj);

          //console.log("   spawnArray: "+JSON.stringify($scope.spawnArray));
  	}	
  	else
  	if($scope.showCtrl=="player")
  	{
  		var sObj=$.extend({}, $scope.playersSet[sTool], true);
  		
  		sObj.state='new';
  		sObj.posObj=posObj;
      sObj.rotate=$scope.drawRotate;
      sObj.img=sObj.file;
      sObj.shopCnt=0;
      $scope.playerObj=sObj;
      $scope.playerObj.originX=posObj.tileX;
      $scope.playerObj.originY=posObj.tileY;
      
  		console.log("<boardClick> selectedTool: "+JSON.stringify($scope.playerObj));
      console.log("             origin: "+$scope.playerObj.originX,$scope.playerObj.originY);
  	}
  }
  }




  $scope.boardMouse=function($event)
  {
  	var posObj={};
  	posObj.x = $event.pageX - $('#gameBoard').offset().left
    posObj.y = $event.pageY - $('#gameBoard').offset().top
    posObj.tileX=Math.floor(posObj.x / 50);
    posObj.tileY=Math.floor(posObj.y / 50);
  	console.log('      tile:'+JSON.stringify( $scope.tileArray[posObj.tileX][posObj.tileY] ));
  }

  $scope.createEmptyMap=function()
  {

    
    $scope.boardWidth=$scope.boardWidthPending;
  	$scope.boardHeight=$scope.boardHeightPending;
  	console.log("<createEmptyMap> "+$scope.boardWidth+"x"+$scope.boardHeight);
    
  	$('#boardCanvas').attr('width',($scope.boardWidth*50)+'px');
  	$('#boardCanvas').attr('height',($scope.boardHeight*50)+'px');
  	$scope.tileArray=[];
  	$scope.productArray=[];
  	$scope.spawnArray=[];
  	$scope.productMap=[];
    $scope.objMap=[];
    $scope.objArray=[];
    
  	for(var i=0;i<$scope.boardWidth;i++)
  	{
  		var tileObj=[];
  		var productObj=[];
      var objObj=[];
  		

  		for(var j=0;j<$scope.boardHeight;j++)
  			{ if(i==0 || i==$scope.boardWidth-1 ||
  			  	 j==0 || j==$scope.boardHeight-1)
  			  { tileObj.push("0"); }
  			  else
  			  { tileObj.push("3"); }
  			
  			  productObj.push(null); 
          objObj.push(null);
  			}

  		$scope.tileArray.push(tileObj);
  		$scope.productMap.push(productObj);
  		$scope.objMap.push(objObj);
  	}
    

  	$scope.drawMap(0,0);
  }


  $scope.doWobble=function()
  {
    
    if($scope.playerObj.state!=='dead')
    {
      if($scope.wobble>$scope.wobbleRangeHigh)
        { $scope.wobbleDir=-1; }
      if($scope.wobble<$scope.wobbleRangeLow)
        { $scope.wobbleDir=1; }
      $scope.wobble=$scope.wobble+($scope.wobbleSpeed*$scope.wobbleDir);
    }
  }

  $scope.procGameTimer=function()
  {
    if($scope.gamePaused==false)
    {
      $scope.doWobble();
    	$scope.stepSpawns();
    	$scope.stepPlayer();
    	$scope.procProduct();
    	$scope.gameClockCount++;
    	$scope.$apply();
    }
  }

  $scope.startGameTimer=function()
  {
    $scope.playerOrigin= $.extend({},$scope.playerObj, true) ;
    $scope.playerOrigin.posObj= $.extend({},$scope.playerObj.posObj, true) ;

  	$scope.gameRun=true;
    $scope.playerObj.testState="XYZ";

     if(gameTimer) {
        clearInterval(gameTimer);
    }

    gameTimer = setInterval(function(){$scope.procGameTimer()}, 50);
  }


  $scope.clearGameTimer=function()
  {
   
    $scope.playerObj= $.extend({},$scope.playerOrigin, true) ;
  	$scope.gameRun=false;
    clearInterval(gameTimer);   
  }

   $scope.onKeyDown = function(keyEvent) {
       };

  $scope.clearTimers=function()
  {
    if($scope.startTimer) {
      $timeout.cancel($scope.startTimer);
    }
    if($scope.countdownTimer) {
      $timeout.cancel($scope.countdownTimer);
    }
  }

  $scope.setStartTimer=function()
  {
    $scope.clearTimers();
    $scope.startTimer=$timeout(function() {
      
        $scope.startStep++;
        if($scope.startStep<11 && $scope.pregame==true)
          { $scope.setStartTimer(); }
        
    }, 2000);
  }

  $scope.shopNow=function()
  {
    $scope.pregame=false;
    $scope.countdown=true;
    $scope.loadLevel();
  };

  $scope.startCountdown=function()
  {
    $scope.clearTimers(); 
    $scope.countdownTimer=$timeout(function() {
      
        $scope.countdownStep++;
        if($scope.countdownStep<3 && $scope.countdown==true)
          { $scope.startCountdown(); }
        else
          { 
            $scope.countdown=false;
            $scope.startGameTimer();
            $scope.gamePaused=false;

          }
        
    }, 1000);

    //$scope.startGameTimer();

  }

  $scope.cashOut=function()
  {
    if(!$scope.cashOutIcon)
    {
      var fail=false;
    
      for(var i=0;i<$scope.shoplistSet.length;i++)
      {
        if($scope.shoplistSet[i].needed>0)
        {
          if($scope.shoplistSet[i].needed-$scope.shoplistSet[i].inventory>0)
          {
            fail=true;
          }      
        }
      }

      if(fail==true)
      {
        $scope.cashOutIcon="sprites/iconX.png";
        $scope.gameMsg="You missed items on your list!";
        $scope.playSound('buzzer');
      }
      else
      {
        $scope.cashOutIcon="sprites/iconDollar.png";
        $scope.gameScore=$scope.gameScore+($scope.levelBudget-$scope.levelTotal);
        $scope.gameMsg="Good Job!"

        $scope.gamePaused=true;

        $scope.showLevelDialog=true;
        console.log("<showLevelDialog> "+$scope.levelToLoad+" ... "+$scope.maxLevel);
        if($scope.levelToLoad==$scope.maxLevel)
        {
          console.log("GAME OVER");
          $scope.gameOver=true;
        }
        if($scope.levelBudget-$scope.levelTotal>0) { $scope.playSound('bigsavings'); }
        else { $scope.playSound('overbudget'); }
        
      }

      if( $scope.cashOutFailTimer)
      { $timeout.cancel( $scope.cashOutFailTimer); }
      
      $scope.cashOutFailTimer=$timeout(function() {
        $scope.cashOutIcon=null;
        $scope.gameMsg="";
      }, 1500);
    }
      
  
  }

  $scope.playSound=function(snd,arg)
  {
    console.log("SOUND: "+snd+","+arg);
   
    var sndFile=null;
    var ext='.mp3';
    var vol=1;

    switch(snd)
    {
      case 'readysetshop': 
      { sndFile='snd/readysetshop'+ext; break; }
      case 'shop': 
      { var rnd=Math.floor(Math.random() * 3);
        sndFile='snd/shop'+rnd+ext; break; }
        /* speed, sale, slide, slow */
      case 'speed':
      { sndFile='snd/coffee'+ext; vol=.4; break; }
      case 'sale':
      { 
        if(arg==.25) { sndFile='snd/sale0'+ext; }
        if(arg==.5) { sndFile='snd/sale1'+ext; }
        if(arg==.75) { sndFile='snd/sale2'+ext; }
        break; }
      case 'slide':
      { sndFile='snd/slide'+ext; break; }
      case 'slow':
      { sndFile='snd/slow'+ext; break; }
      case 'buzzer':
      { sndFile='snd/buzzer'+ext; break; }
      case 'overbudget':
      { sndFile='snd/overbudget'+ext; break; }
       case 'bigsavings':
      { sndFile='snd/bigsavings'+ext; break; }
    
      case 'kill':
      { 
        var kId=0;
        switch(arg)
        {
            case "White Trash": { kId=0; break; }
            case "Baby Momma": { kId=1; break; }
            case "Geiser": { kId=2; break; }
            case "Vato": { kId=3; break; }
            case "Shopaholic": { kId=4; break; }
            case "Last Minute": { kId=5; break; }
            case "Track Suit": { kId=6; break; }
            case "Kids": { kId=7; break; }
            case "Spinster": { kId=9; break; }
            case "Bargin Hunter": { kId=8; break; }
        }
        console.log(" KILL: "+kId);
        sndFile='snd/kill'+kId+ext;
        break;
      }
      
      

    }

    if(sndFile)
    {
      var sound = new Howl({
        urls: [sndFile],
        volume: vol
      }).play();
    }

  }

  $scope.init=function()
  {

    	$(document).keydown(function(e) 
    	{
         var keyDownEvent = e || window.event,
          keycode = (keyDownEvent.which) ? keyDownEvent.which : keyDownEvent.keyCode;
         
      	$scope.trapKeypress(e.which,e.keyCode);
  	  }); 


  	$scope.loadTileSet();  
  	$scope.loadObjSet();
    $scope.loadProductSet();
  	$scope.loadSpawnSet();
    $scope.loadPlayersSet();
  	$scope.playerObj.buffCtr=0;

    $scope.startStep=0;
    if($scope.gameRun==true)
    {
      $scope.setStartTimer();
    }
    else
    {
      $scope.pregame=false;
      $scope.countdown=false;
    }


   

  }




  $scope.init();

}]);  