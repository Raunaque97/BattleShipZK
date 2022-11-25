<script lang="ts">
  import Peer from "peerjs";
  import zkChannelManager from "../rcadeNet/zkChannelManager";

  let opponentId = "";
  let connected = false;

  let peer = new Peer({
    secure: true,
    host: "peerjs-broker-2131.herokuapp.com",
    port: 443,
  });
  let conn;
  let zkcm;
  peer.on("error", (err) => {
    console.log("Network: Network/peer error: " + err);
  });
  peer.on("connection", (connection) => {
    conn = connection;
    connected = true;
    console.log("Network: Connected to opponent ID", connection.peer);
    // @ts-ignore
    zkcm = new zkChannelManager(connection, submitInput);
    zkcm.startAsB();
  });

  // super hacky
  setTimeout(() => {
    peer = peer;
    console.log("Network: Peer ID", peer.id);
  }, 500);

  async function looper() {
    while (true) {
      let userInput = await submitInput();
      console.log("userInput", userInput);
      // console.log(peer.id);
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // console.log("sleeping done");
    }
  }
  // looper();
  let x, y;
  var handleClick;
  async function submitInput() {
    return new Promise((resolve, reject) => {
      handleClick = () => resolve({ x, y });
    });
  }
</script>

<div>
  {#if connected}
    <p>Connected to opponent ID</p>
    <!-- display flex withspace inbetween -->
    <div style="display: flex; justify-content: space-between;">
      <!-- input numbers x,y between 0 , 9 -->
      <input type="number" min="0" max="9" bind:value={x} placeholder="x" />
      <input type="number" min="0" max="9" bind:value={y} placeholder="y" />
      <button on:click={handleClick}>Fire</button>
    </div>
  {:else}
    <p>Your ID: {peer.id}</p>
    <p>share your ID with others to connect, or join using other's ID</p>
    <div style="display:flex">
      <input type="text" bind:value={opponentId} />
      <button
        on:click={() => {
          console.log("opponentId", opponentId);
          conn = peer.connect(opponentId, { reliable: true }); // TODO change peerId,
          conn.on("open", () => {
            connected = true;
            console.log("Network: peer connected, innitiator");
            // @ts-ignore
            zkcm = new zkChannelManager(conn, submitInput);
            zkcm.startAsA();
          });
          conn.on("error", (err) => {
            console.log("Network/peerConn, innitiator error: " + err);
          });
        }}>connect</button
      >
    </div>
  {/if}
</div>
