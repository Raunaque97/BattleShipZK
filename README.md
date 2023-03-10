# Project Rcade POC

A Battleships game implementation as POC for implementing 2 party p2p hidden imformation games.

### Frontend

A simple front-end is implemented using svelte to test the circuits and concepts.

## compiling circuits

###### 1. perform powersOfTau to produce \*.ptau files need for verification ket generation

https://docs.circom.io/getting-started/proving-circuits/#powers-of-tau

Running `circom {}.circom --r1cs --wasm --sym`
produces `{}.rics` & `{}.wasm` files

#### generating {}.zkey

`snarkjs groth16 setup {}.r1cs pot12_final.ptau circuit.zkey`

#### Extracting the verification key from `.zkey`

`snarkjs zkey export verificationkey circuit.zkey verification_key.json`

### Or use compile.sh

`cd` into circuits and run `./compile.sh` it runs all the above necessary commands and conviniently places the .wasm, .zkey files in the respective target locations inside `/frontend` to be used by the dapp.

## TODO

- Implement SmartContracts to penalize abusers, time guarantees enforced on-chain.
- Implement a "shady client" to easily test the obustness of the protocol
- Explore recursive proofs, a single proof of the entire game played correctly
