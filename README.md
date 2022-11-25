### compile circuits

`circom {}.circom --r1cs --wasm --sym`

produces `{}.rics` & `{}.wasm` files

#### perform powersOfTau to produce \*.ptau files

https://docs.circom.io/getting-started/proving-circuits/#powers-of-tau

### generating {}.zkey

`snarkjs groth16 setup {}.r1cs pot12_final.ptau circuit.zkey`

### Extracting the verification ket from `.zkey`

`snarkjs zkey export verificationkey circuit.zkey verification_key.json`
