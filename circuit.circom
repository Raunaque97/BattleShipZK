pragma circom 2.0.0;

include "./node_modules/circomlib/circuits/mimcsponge.circom";
include "./node_modules/circomlib/circuits/comparators.circom";

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

   A:(State) => {
      for(i=0; i<5; i++)
         State.A.shipPositions[i][0]=privateInput(x => (x>=0 && x<10))
         State.A.shipPositions[i][1]=privateInput(x => (x>=0 && x<10))
   },
   B:(State) => {
      for(i=0; i<5; i++)
         State.B.shipPositions[i][0]=privateInput(x => (x>=0 && x<10))
         State.B.shipPositions[i][1]=privateInput(x => (x>=0 && x<10))
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
   // shipPositions[i][0] and shipPositions[i][1] should be between 0 and 9
   component gte0[5];
   component lt0[5];
   component gte1[5];
   component lt1[5];
   for (var i = 0; i < 5; i++) {
      // shipPositions[i][0] >= 0
      gte0[i] = GreaterEqThan(4); // 4bits for 0-9
      gte0[i].in[0] <== shipPositions[i][0];
      gte0[i].in[1] <== 0;
      gte0[i].out === 1;

      // shipPositions[i][0] < 10
      lt0[i] = LessThan(4); // 4bits for 0-9
      lt0[i].in[0] <== shipPositions[i][0];
      lt0[i].in[1] <== 10;
      lt0[i].out === 1;

      // shipPositions[i][1] >= 0
      gte1[i] = GreaterEqThan(4); // 4bits for 0-9
      gte1[i].in[0] <== shipPositions[i][1];
      gte1[i].in[1] <== 0;
      gte1[i].out === 1;

      // shipPositions[i][1] < 10
      lt1[i] = LessThan(4); // 4bits for 0-9
      lt1[i].in[0] <== shipPositions[i][1];
      lt1[i].in[1] <== 10;
      lt1[i].out === 1;
   }

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
