<script lang="ts">
  import HomePage from "./lib/HomePage.svelte";

  // import { onMount } from "svelte";
  // import * as verification_key from "../../verification_key.json";
  // let snarkjs = window.snarkjs as any; // supeer hack

  // let input = {
  //   Aships: "5",
  //   Bships: "5",
  //   x: "5",
  //   y: "5",
  //   shipPositions: [
  //     ["0", "0"],
  //     ["0", "0"],
  //     ["0", "0"],
  //     ["0", "0"],
  //     ["0", "0"],
  //   ],
  // };
  // console.log({ verification_key });

  // async function calculateProof(input) {
  //   const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  //     input,
  //     "circuit.wasm",
  //     "circuit.zkey"
  //   );
  //   console.log({ proof, publicSignals });

  //   const vkey = await fetch("verification_key.json").then(function (res) {
  //     return res.json();
  //   });

  //   const res = await snarkjs.groth16.verify(vkey, publicSignals, proof);

  //   console.log("dff", res);
  // }
  // calculateProof(input);

  // async function verify(input) {}
</script>

<main>
  <HomePage />
</main>

<style>
</style>
