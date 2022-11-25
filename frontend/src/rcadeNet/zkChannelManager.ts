import type DataConnection from "peerjs";

export default class zkChannelManager {
  //   state: any = {};
  seq: number = 0;
  waitingForPeer: boolean = false;

  conn: DataConnection;

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
    // update state
    // generate proof and send to peer

    //@ts-ignore
    this.conn.send(JSON.stringify({ userInputs }));
    this.waitingForPeer = true; // set max wait time
    console.log("handlePlayerMove: sending data", { userInputs });
  }
}
