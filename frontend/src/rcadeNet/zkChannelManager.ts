import type DataConnection from "peerjs";
import * as verification_key from "../../public/verification_key.json";
import stringify from "canonical-json";
import { sha256, hmacSHA512, Base64 } from "crypto-js";

export default class zkChannelManager {
  //   state: any = {};
  seq: number = 0;
  waitingForPeer: boolean = false;

  conn: DataConnection;

  snarkjs = (window as any).snarkjs as any; // supeer hack

  submitInput: () => Promise<any>;

  constructor(conn: DataConnection, submitInput: () => Promise<any>) {
    this.conn = conn;
    this.submitInput = submitInput;
    console.log("zkChannelManager created", conn);
    //@ts-ignore
    this.conn.on("data", (msg) => {
      console.log("Network: data received: " + msg);
      //@ts-ignore
      msg = JSON.parse(msg);
      this.handlePeerMsg(msg);
    });
  }

  public startAsA(): void {
    this.handlePlayerMove();
    this.waitingForPeer = false;
  }

  public startAsB(): void {
    this.handlePlayerMove();
    this.waitingForPeer = true;
  }

  private handlePeerMsg(msg: any) {
    if (this.waitingForPeer) {
      this.waitingForPeer = false;
    } else {
      console.log("Network: unexpected message");
      return;
      // TODO: catch cheater
    }
    // extract data, signature and proof
    // verify signature
    // verify proofs public input hash matches previous state hash
    // verify proof, if valid, update state else complain to smart contract
    // update states

    this.handlePlayerMove();
  }

  private async handlePlayerMove() {
    let userInputs = await this.submitInput();
    // init
    if (this.seq == 0) {
      // generate proof and send to peer
      const { proof, publicSignals } = await this.snarkjs.groth16.fullProve(
        userInputs,
        "circuit.wasm",
        "circuit.zkey"
      );

      let data = {
        seq: this.seq,
        proof: proof,
        publicSignals: publicSignals,
      };
      // sign data
      let signature = Base64.stringify(
        hmacSHA512(sha256(stringify(data)), "123") // normal JSON.stringify doesnot honor object key order TODO: setup pvt key
      );

      // @ts-ignore
      this.conn.send(JSON.stringify({ data: data, signature: signature }));
    }

    // update state

    this.waitingForPeer = true; // set max wait time
    console.log("handlePlayerMove: sending data", { userInputs });
  }
}
