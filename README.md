### compiling circuits

`circom {}.circom --r1cs --wasm --sym`
produces `{}.rics` & `{}.wasm` files

#### perform powersOfTau to produce \*.ptau files

https://docs.circom.io/getting-started/proving-circuits/#powers-of-tau

#### generating {}.zkey

`snarkjs groth16 setup {}.r1cs pot12_final.ptau circuit.zkey`

#### Extracting the verification key from `.zkey`

`snarkjs zkey export verificationkey circuit.zkey verification_key.json`

### Using compile.sh

cd into circuits and run `./compile.sh` it runs all the above necessary commands and conviniently places the .wasm, .zkey files in the respective target locations inside `/frontend` to be used by the dapp.
