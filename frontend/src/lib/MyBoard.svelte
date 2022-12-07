<script lang="ts">
  import { draggable } from "@neodrag/svelte";

  export let shipPositions: [number, number][];
  export let frozen = false;

  console.log("shipPositions", shipPositions);

  function handleDrop(offsetX, offsetY, prevRow, prevCol) {
    // the ships should snap to the nearest grid
    let newRow = Math.round(offsetY / 30);
    let newCol = Math.round(offsetX / 30);
    // if the new pos is empty, update the ship position else revert the ship to its previous position
    if (!shipPositions.some((pos) => pos[0] === newRow && pos[1] === newCol)) {
      shipPositions = shipPositions.map((pos) => {
        if (pos[0] === prevRow && pos[1] === prevCol) {
          return [newRow, newCol];
        }
        return pos;
      });
    } else {
      shipPositions = shipPositions; // triggers a re-render
    }
  }

  // shipPositions.map((e) => {
  //   console.log(e);
  // });
</script>

<div class="board">
  <!-- draw a 300 x 300 light blue rectangle for board with 10x10 grid pattern with white lines  -->
  <svg
    width="300"
    height="300"
    viewBox="0 0 300 300"
    fill="none"
    class="svg-element"
  >
    <rect width="300" height="300" fill="#C4C4C4" />
    <rect width="300" height="300" fill="url(#pattern)" />
    <defs>
      <pattern
        id="pattern"
        patternUnits="userSpaceOnUse"
        width="30"
        height="30"
      >
        <path
          d="M 0 0 L 30 0 L 30 30 L 0 30 Z"
          fill="none"
          stroke="white"
          stroke-width="1"
        />
      </pattern>
    </defs>
  </svg>
  <!-- loop over ship positions add dragable divs -->
  {#each shipPositions as [row, col]}
    <div
      class="ship"
      style="opacity: {frozen ? 0.5 : 1}"
      use:draggable={{
        position: { x: col * 30, y: row * 30 },
        disabled: frozen,
        bounds: "parent",

        onDragEnd: ({ offsetX, offsetY, domRect }) => {
          // console.log(offsetX, offsetY, row, col, shipPositions);
          handleDrop(offsetX, offsetY, row, col);
        },
      }}
    />
  {/each}
</div>

<style>
  .board {
    position: relative;
    width: 300px;
    height: 300px;
  }
  .svg-element {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }
  .ship {
    position: absolute;
    width: 30px;
    height: 30px;
    background-color: black;
    border-radius: 3px;
    z-index: 2;
  }
</style>
