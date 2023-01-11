pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/mimcsponge.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

/*
   Aships:5,
	Bships:5,
	x:10,
   y:20,
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
   x === 10;
   y === 10;
   // input constrains, shipPositions[i][0] and shipPositions[i][1] should be between 0 and 9
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

   // no ships should overlap
   component eq1[10];
   component eq2[10];
   component and1[10];
   var c = 0;
   for (var i = 0; i < 5; i++) {
      for (var j = i+1; j < 5; j++) {
         // shipPositions i and j should not overlap, or
         // (shipPositions[i][0] == shipPositions[j][0]) && (shipPositions[i][1] == shipPositions[j][1]) == false
         eq1[c] = IsEqual();
         eq1[c].in[0] <== shipPositions[i][0];
         eq1[c].in[1] <== shipPositions[j][0];
         eq2[c] = IsEqual();
         eq2[c].in[0] <== shipPositions[i][1];
         eq2[c].in[1] <== shipPositions[j][1];
         and1[c] = AND();
         and1[c].a <== eq1[c].out;
         and1[c].b <== eq2[c].out;
         and1[c].out === 0;

         c++;
      }
   }

   // calculate hash of private states
   component hasher = MiMCSponge(10, 220, 1);
   hasher.k <== 0;
   for (var i = 0; i < 5; i++) {
      hasher.ins[i*2] <== shipPositions[i][0];
      hasher.ins[1+i*2] <== shipPositions[i][1];
   }
   hash <== hasher.outs[0];

}

component main { public [Aships, Bships, x, y] } = Main();
