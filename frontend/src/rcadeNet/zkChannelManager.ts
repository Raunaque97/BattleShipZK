import type DataConnection from "peerjs";
import * as init_vk from "../assets/init_vk.json";
import * as moveA_vk from "../assets/moveA_vk.json";
import * as moveB_vk from "../assets/moveB_vk.json";
import stringify from "canonical-json";
import sha256 from "crypto-js/sha256";
import hmacSHA512 from "crypto-js/hmac-sha512";
import Base64 from "crypto-js/enc-base64";

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

    console.log("zkChannelManager created", conn);
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
    this.vkeys["move"] = move_vk;
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
      console.log("Network: unexpected message");
      return;
      // TODO: catch cheater
    }
    // extract data, signature and proof
    let { data, signature } = msg;
    let proof = data.proof;
    let publicSignals = data.publicSignals;
    // TODO: verify signature
    let peerPublicKey = this.conn.peer;
    console.log("handlePeerMsg: received data", { msg });

    if (data.seq != this.peerSeq) {
      console.warn("handlePeerMsg: seq mismatch", data.seq, this.peerSeq);
    }
    // verify proofs public input hash matches previous state hashes
    // verify proof, if valid, update state else complain to smart contract
    if (this.peerSeq == 0) {
      // TODO find a more generic way
      const res = await this.snarkjs.groth16.verify(
        this.vkeys["init"],
        publicSignals,
        proof
      );
      console.log("handlePeerMsg: proof verified", res);
      if (!res) {
        console.error("handlePeerMsg: proof verification failed!!!"); // TODO complain to smart contract
      }
    } else {
      let res = await this.snarkjs.groth16.verify(
        this.vkeys["move"],
        publicSignals,
        proof
      );
      // prevPvtHash should match peerPvtStateHash
      if (publicSignals[1] != this.peerPvtStateHash) {
        console.error("handlePeerMsg: pvtStateHash mismatch!!!"); // TODO complain to smart contract
        res = false;
      }
      console.log("handlePeerMsg: proof verified", res);
      if (!res) {
        console.error("handlePeerMsg: proof verification failed!!!"); // TODO complain to smart contract
      }
    }

    this.peerSeq++;
    // update states
    // TODO: extract public state variables from publicSignals and verify but for now
    this.pubState = data.pubState;
    this.peerPvtStateHash = data.publicSignals[0]; // circuit outputs pvtStateHash

    this.handlePlayerMove();
  }

  private async handlePlayerMove() {
    let newSates = await this.submitInput();
    // init
    let proof;
    let publicSignals;
    if (this.seq == 0) {
      console.log("handlePlayerMove: generating proof", { newSates });
      ({ proof, publicSignals } = await this.snarkjs.groth16.fullProve(
        { ...newSates.pubState, ...newSates.pvtState },
        "init.wasm",
        "init.zkey"
      ));
    } else {
      // add _prev postfix to all prevState variables
      let prevStates = {};
      for (let key in this.pubState) {
        prevStates[key + "_prev"] = this.pubState[key];
      }
      for (let key in this.pvtState) {
        prevStates[key + "_prev"] = this.pvtState[key];
      }
      console.log(
        "handlePlayerMove: generating proof",
        { prevStates },
        { newSates }
      );
      // generate proof
      ({ proof, publicSignals } = await this.snarkjs.groth16.fullProve(
        {
          ...prevStates,
          ...newSates.pubState,
          ...newSates.pvtState,
          prevPvtHash: this.pvtStateHash,
        },
        "move.wasm",
        "move.zkey"
      ));
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
    console.log("handlePlayerMove: sending data", { data });

    this.waitingForPeer = true; // set max wait time
    this.seq++;
    // console.log("handlePlayerMove: waiting for peer", this.seq);
  }
}
