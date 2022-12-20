<script lang="ts">
  import Peer from "peerjs";
  import zkChannelManager from "../rcadeNet/zkChannelManager";
  import Web3 from "web3";
  import MyBoard from "./MyBoard.svelte";

  let opponentId = "";
  let connected = false;

  const web3 = new Web3();
  // generate a new wallet, TODO read from local storage if exists
  let wallet = web3.eth.accounts.create();
  console.log("wallet", wallet);
  const pvtkey = wallet.privateKey;

  let peer = new Peer(wallet.address.toLowerCase().substring(2, 5), {
    secure: true,
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
    zkcm = new zkChannelManager(connection, submitInput, pvtkey);
    zkcm.startAsB();
  });

  // super hacky
  setTimeout(() => {
    peer = peer;
    console.log("Network: my Peer ID", peer.id);
  }, 500);

  async function looper() {
    while (true) {
      // let userInput = await submitInput();
      // console.log("userInput", userInput);
      // console.log(peer.id);
      zkcm = zkcm; // Super hacky
      await new Promise((resolve) => setTimeout(resolve, 100));
      // console.log("sleeping done");
    }
  }
  looper();

  let x, y;
  var handleClick;
  async function submitInput() {
    return new Promise((resolve, reject) => {
      handleClick = () => {
        if (zkcm.seq == 0) {
          //innit
          resolve(getInnitState());
        }
        resolve(getNextState());
      };
    });
  }

  let shipPositions = [];
  // generate random ship positions and prevent overlap
  while (shipPositions.length < 5) {
    let x = Math.floor(Math.random() * 10);
    let y = Math.floor(Math.random() * 10);
    if (!shipPositions.some((pos) => pos[0] == x && pos[1] == y)) {
      shipPositions.push([x, y]);
    }
  }
  function getInnitState(): any {
    console.log("getInnitState, shipPositions", shipPositions);
    let state = {
      pubState: {
        Aships: 5,
        Bships: 5,
        x: 10,
        y: 10,
      },
      pvtState: {
        shipPositions: shipPositions,
      },
    };
    return state;
  }
  function getNextState(): unknown {
    // find if hit
    let hit = shipPositions.some(
      (pos) => pos[0] == zkcm.pubState.x && pos[1] == zkcm.pubState.y
    );

    let state = {
      pubState: {
        Aships:
          hit && zkcm.isA ? zkcm.pubState.Aships - 1 : zkcm.pubState.Aships,
        Bships:
          hit && !zkcm.isA ? zkcm.pubState.Bships - 1 : zkcm.pubState.Bships,
        x: x,
        y: y,
      },
      pvtState: {
        shipPositions: shipPositions,
      },
    };
    return state;
  }
</script>

<div>
  <p>burner wallet address: {wallet.address}</p>
</div>

<div>
  {#if connected}
    <p>Connected to opponent ID: {opponentId}</p>
    <h3>Turn {zkcm.seq}</h3>
    {#if zkcm.isA}
      <p>A, your ships: {zkcm.pubState.Aships}</p>
    {:else}
      <p>B, your ships: {zkcm.pubState.Bships}</p>
    {/if}
    <MyBoard bind:shipPositions frozen={zkcm.seq > 0} />
    <!-- if zkcm.seq == 0 -->
    {#if zkcm.seq == 0}
      <div>
        {#if zkcm.waitingForPeer}
          <p>Waiting for opponent...</p>
        {:else}
          <p>Enter your ship positions</p>
          <button on:click={handleClick}>start</button>
        {/if}
      </div>
    {:else if zkcm.waitingForPeer}
      <p>Waiting for opponent...</p>
    {:else}
      <p>Fire your shot</p>
      <div style="display: flex; justify-content: space-between;">
        <!-- input numbers x,y between 0 , 9 -->
        <input type="number" min="0" max="9" bind:value={x} placeholder="x" />
        <input type="number" min="0" max="9" bind:value={y} placeholder="y" />
        <button on:click={handleClick}>Fire</button>
      </div>
    {/if}
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
            zkcm = new zkChannelManager(conn, submitInput, pvtkey);
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
