import type DataConnection from "peerjs";
import * as verification_key from "../assets/verification_key.json";
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
  peerPvtStateHash: any;
  pvtKey;

  vkeys = verification_key;

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

    // verify proofs public input hash matches previous state hashes
    // verify proof, if valid, update state else complain to smart contract
    if (this.peerSeq == 0) {
      // TODO find a more generic way
      const res = await this.snarkjs.groth16.verify(
        this.vkeys,
        publicSignals,
        proof
      );
      console.log("handlePeerMsg: proof verified", res);
      if (!res) {
        console.error("handlePeerMsg: proof verification failed!!!"); // TODO complain to smart contract
      }
    }

    this.peerSeq++;
    // update states
    // TODO: extract public state variables from publicSignals but for now
    this.pubState = data.pubState;
    this.peerPvtStateHash = data.pvtStateHash;

    this.handlePlayerMove();
  }

  private async handlePlayerMove() {
    let newSates = await this.submitInput();
    // init
    let proof;
    let publicSignals;
    if (this.seq == 0) {
      // generate proof
      console.log("handlePlayerMove: generating proof", newSates);
      ({ proof, publicSignals } = await this.snarkjs.groth16.fullProve(
        newSates,
        "circuit.wasm",
        "circuit.zkey"
      ));
    } else {
      // TODO: generate proof and send to peer
      console.log("handlePlayerMove: generating proof", newSates);

      // generate proof
      proof = null; // TODO
      publicSignals = null;
    }

    // update state, TODO find a geneic way!
    let shipPositions;
    ({ shipPositions, ...this.pubState } = newSates);
    this.pvtState = shipPositions;

    let data = {
      seq: this.seq,
      proof: proof,
      publicSignals: publicSignals,
      pvtStateHash: Base64.stringify(sha256(stringify(this.pvtState))),
      pubState: this.pubState, // TODO: not exactly needed as it is already in publicSignals
    };
    // sign data
    let signature = Base64.stringify(
      hmacSHA512(sha256(stringify(data)), this.pvtKey) // normal JSON.stringify doesnot honor object key order
    );
    // @ts-ignore
    this.conn.send(JSON.stringify({ data: data, signature: signature }));
    console.log("handlePlayerMove: sending data", { newSates });

    // update state

    this.waitingForPeer = true; // set max wait time
    this.seq++;
    // console.log("handlePlayerMove: waiting for peer", this.seq);
  }
}
