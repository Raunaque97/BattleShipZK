import type DataConnection from "peerjs";
import * as init_vk from "../assets/init_vk.json";
import * as moveA_vk from "../assets/moveA_vk.json";
import * as moveB_vk from "../assets/moveB_vk.json";
import stringify from "canonical-json";
import sha256 from "crypto-js/sha256";
import hmacSHA512 from "crypto-js/hmac-sha512";
import Base64 from "crypto-js/enc-base64";
import { consoleStyles } from "./constants";

export default class zkChannelManager {
  //   state: any = {};
  seq: number = 0;
  peerSeq: number = 0;
  isA: boolean = false; // whther this player is A or B
  waitingForPeer: boolean = false;
  conn: DataConnection;
  snarkjs = (window as any).snarkjs as any; // supeer hack
  submitInput: () => Promise<any>;

  pubState: any = {};
  pvtState: any = {};
  pvtStateHash: any;
  peerPvtStateHash: any;
  pvtKey;

  vkeys = {};

  constructor(
    conn: DataConnection,
    submitInput: () => Promise<any>,
    pvtKey: string
  ) {
    this.conn = conn;
    this.submitInput = submitInput;
    this.pvtKey = pvtKey;

    console.log("zkChannelManager created", { conn });
    //@ts-ignore
    this.conn.on("data", (msg) => {
      // console.log("Network: data received: " + msg);
      //@ts-ignore
      msg = JSON.parse(msg);
      this.handlePeerMsg(msg);
    });

    // get json from verification_key.json
    // let vkey = verification_key;
    this.vkeys["init"] = init_vk;
    this.vkeys["moveA"] = moveA_vk;
    this.vkeys["moveB"] = moveB_vk;
  }

  public startAsA(): void {
    this.handlePlayerMove();
    this.waitingForPeer = false;
    this.isA = true;
    this.seq = 0;
    this.peerSeq = 0;
  }

  public startAsB(): void {
    this.handlePlayerMove();
    this.waitingForPeer = true;
    this.isA = false;
    this.seq = 0;
    this.peerSeq = 0;
  }

  private async handlePeerMsg(msg: any) {
    if (this.waitingForPeer) {
      this.waitingForPeer = false;
    } else {
      console.warn(
        "%cP2P <<<",
        consoleStyles.important,
        "unexpected message received:",
        { msg }
      );
      return;
      // TODO: catch cheater
    }
    // extract data, signature and proof
    let { data, signature } = msg;
    let proof = data.proof;
    let publicSignals = data.publicSignals;
    // TODO: verify signature
    let peerPublicKey = this.conn.peer;
    console.log("%cP2P <<<", consoleStyles.important, "received data:", {
      msg,
    });
    if (data.seq != this.peerSeq) {
      console.warn(
        "%cP2P <<<",
        consoleStyles.important,
        `seq mismatch !!, peer send {data.seq} but expecting ${this.peerSeq}`
      );
    }

    // verify proof, if valid, update state else complain to smart contract
    // time the following execution
    let time = performance.now();
    let res = await this.verifyProof(proof, publicSignals);
    time = performance.now() - time;
    if (res) {
      // update states
      console.log(
        `%c proofVerification: proof verified in ${(time / 1000).toFixed(
          5
        )} sec`,
        consoleStyles.verification_success
      );

      this.peerSeq++;
      // update states
      // TODO: extract public state variables from publicSignals and verify but for now, (vernability)
      this.pubState = data.pubState;
      this.peerPvtStateHash = data.publicSignals[0]; // circuit outputs pvtStateHash
      this.handlePlayerMove();
    } else {
      console.error("handlePeerMsg: proof verification failed!!!"); // TODO complain to smart contract
    }
  }

  private async verifyProof(proof: any, publicSignals: any): Promise<boolean> {
    let verification_key;
    // find vkey to verify proof
    if (this.peerSeq == 0) {
      verification_key = this.vkeys["init"];
    } else {
      verification_key = this.isA ? this.vkeys["moveB"] : this.vkeys["moveA"];
      // prevPvtHash should match peerPvtStateHash, peer may use incorrect input to proof.
      if (publicSignals[1] != this.peerPvtStateHash) {
        console.error("proofVerification: pvtStateHash doesn't match!!!");
        return false;
      }
    }
    return await this.snarkjs.groth16.verify(
      verification_key,
      publicSignals,
      proof
    );
  }

  private async handlePlayerMove() {
    let newSates = await this.submitInput();
    // init
    let proof;
    let publicSignals;
    let inputs = undefined;
    let vkeyName = undefined;

    console.log("handlePlayerMove: generating proof");
    if (this.seq == 0) {
      inputs = { ...newSates.pubState, ...newSates.pvtState };
      vkeyName = "init";
    } else {
      // add _prev postfix to all prevState variables
      let prevStates = {};
      for (let key in this.pubState) {
        prevStates[key + "_prev"] = this.pubState[key];
      }
      for (let key in this.pvtState) {
        prevStates[key + "_prev"] = this.pvtState[key];
      }
      inputs = {
        ...prevStates,
        ...newSates.pubState,
        ...newSates.pvtState,
        prevPvtHash: this.pvtStateHash,
      };
      vkeyName = this.isA ? "moveA" : "moveB";
    }
    try {
      let time = performance.now();
      ({ proof, publicSignals } = await this.snarkjs.groth16.fullProve(
        inputs,
        vkeyName + ".wasm",
        vkeyName + ".zkey"
      ));
      time = performance.now() - time;
      console.log(
        `%c proofGeneration: proof generated in ${(time / 1000).toFixed(
          5
        )} sec`,
        consoleStyles.proof_generation
      );
    } catch (error) {
      console.warn(
        "%cproof generation failed!!!",
        consoleStyles.important,
        error
      );
      this.handlePlayerMove();
      return;
    }

    // update states
    // deep copy newSates.pubState
    this.pubState = JSON.parse(JSON.stringify(newSates.pubState));
    this.pvtState = JSON.parse(JSON.stringify(newSates.pvtState));
    this.pvtStateHash = publicSignals[0];

    let data = {
      seq: this.seq,
      proof: proof,
      publicSignals: publicSignals,
      pubState: this.pubState, // TODO: not exactly needed as it is already in publicSignals
    };
    // sign data
    let signature = Base64.stringify(
      hmacSHA512(sha256(stringify(data)), this.pvtKey) // normal JSON.stringify doesnot honor object key order
    );
    // @ts-ignore
    this.conn.send(JSON.stringify({ data: data, signature: signature }));
    console.log("%cP2P>>>: ", consoleStyles.important, "sending data:", {
      data,
    });

    this.waitingForPeer = true; // set max wait time
    this.seq++;
    // console.log("handlePlayerMove: waiting for peer", this.seq);
  }
}
