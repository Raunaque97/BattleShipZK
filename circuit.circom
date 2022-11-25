pragma circom 2.0.0;

include "./node_modules/circomlib/circuits/mimcsponge.circom";

/*
   Aships:5,
	Bships:5,
	x:undefined,
   y:undefined,
   A:{
      shipPositions:[(0,0),(0,0),(0,0),(0,0),(0,0)]
   }
   B:{
      shipPositions:[(0,0),(0,0),(0,0),(0,0),(0,0)]
   }

*/  

template Main() { 
   signal input Aships;  
   signal input Bships;
   signal input x; 
   signal input y;
   signal input shipPositions[5][2];
   signal output hash;
   Aships === 5;
   Bships === 5;
   shipPositions[0][0] === 0;
   shipPositions[0][1] === 0;
   shipPositions[1][0] === 0;
   shipPositions[1][1] === 0;
   shipPositions[2][0] === 0;
   shipPositions[2][1] === 0;
   shipPositions[3][0] === 0;
   shipPositions[3][1] === 0;
   shipPositions[4][0] === 0;
   shipPositions[4][1] === 0;

   // calculate hash
   component hasher = MiMCSponge(14, 220, 2);
   hasher.k <== 0;
   hasher.ins[0] <== Aships;
   hasher.ins[1] <== Bships;
   hasher.ins[2] <== x;
   hasher.ins[3] <== y;
   for (var i = 0; i < 5; i++) {
      hasher.ins[4+i*2] <== shipPositions[i][0];
      hasher.ins[5+i*2] <== shipPositions[i][1];
   }
   hash <== hasher.outs[0];

}

component main = Main();
