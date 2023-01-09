pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/mimcsponge.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/gates.circom";



/**
    (State) => {
        for(i=0; i<5; i++)
            if(State.x==State.A.[0] && State.y==State.A.[1]) // hit
                Aships = Aships-1;
        State.x = publicInput(x => (x>=0 && x<=10))
        State.y = publicInput(x => (x>=0 && x<=10))
        },
*/


// we want to proove that the hash of the state is equal to the hash previous hash and
//  the next state is valid and
//  output the next state hash
template Main() { 
    signal input prevPvtHash;  
    // previous state 
    signal input Aships_prev;
    signal input Bships_prev;
    signal input x_prev;
    signal input y_prev;
    signal input shipPositions_prev[5][2];
    // current state
    signal input Aships;
    signal input Bships;
    signal input x; 
    signal input y;
    signal input shipPositions[5][2];

    signal output hash;

    // hash of private states should be equal to prevPvtHash
    component hasher = MiMCSponge(10, 220, 1);
    hasher.k <== 0;
    for (var i = 0; i < 5; i++) {
        hasher.ins[i*2] <== shipPositions_prev[i][0];
        hasher.ins[1+i*2] <== shipPositions_prev[i][1];
    }
    prevPvtHash === hasher.outs[0];

    // game logic
    var tmp1 = 0;
    component eq1[5];
    component eq2[5];
    component and1[5];
    for (var i = 0; i < 5; i++) {
        eq1[i] = IsEqual();
        eq1[i].in[0] <== shipPositions_prev[i][0];
        eq1[i].in[1] <== x_prev;

        eq2[i] = IsEqual();
        eq2[i].in[0] <== shipPositions_prev[i][1];
        eq2[i].in[1] <== y_prev;
        
        and1[i] = AND();
        and1[i].a <== eq1[i].out;
        and1[i].b <== eq2[i].out;

        tmp1 += and1[i].out;
    }

    Aships === Aships;
    Bships === (Bships_prev - tmp1);

    // calculate hash
    component hasher1 = MiMCSponge(10, 220, 1);
    hasher1.k <== 0;
    for (var i = 0; i < 5; i++) {
        hasher1.ins[i*2] <== shipPositions[i][0];
        hasher1.ins[1+i*2] <== shipPositions[i][1];
    }
    hash <== hasher1.outs[0];
}

component main { public [prevPvtHash, Aships, Bships, x, y] } = Main();