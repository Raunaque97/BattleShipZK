<script lang="ts">
  import { draggable } from "@neodrag/svelte";

  export let shipPositions: [number, number][];
  export let frozen = false;
  const size = 10;
  const gridWidth = 25;

  // console.log("shipPositions", shipPositions);

  function handleDrop(offsetX, offsetY, prevRow, prevCol) {
    // the ships should snap to the nearest grid
    let newRow = Math.round(offsetY / gridWidth);
    let newCol = Math.round(offsetX / gridWidth);
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

<div
  style="position: relative; width: {size * gridWidth}px; height: {size *
    gridWidth}px"
>
  <!-- draw a 300 x 300 light blue rectangle for board with 10x10 grid pattern with white lines  -->
  <svg
    width={size * gridWidth}
    height={size * gridWidth}
    viewBox="0 0 {size * gridWidth} {size * gridWidth}"
    fill="none"
    class="svg-element"
  >
    <rect width={size * gridWidth} height={size * gridWidth} fill="#C4C4C4" />
    <rect
      width={size * gridWidth}
      height={size * gridWidth}
      fill="url(#pattern)"
    />
    <defs>
      <pattern
        id="pattern"
        patternUnits="userSpaceOnUse"
        width={gridWidth}
        height={gridWidth}
      >
        <path
          d="M 0 0 L {gridWidth} 0 L {gridWidth} {gridWidth} L 0 {gridWidth} Z"
          fill="none"
          stroke="white"
          stroke-width="1"
        />
      </pattern>
    </defs>
  </svg>
  <!-- loop over ship positions add dragable divs -->
  {#each shipPositions.filter((p) => p[0] != size || p[1] != size) as [row, col]}
    <div
      class="ship"
      style="width: {gridWidth}px; height: {gridWidth}px; opacity: {frozen
        ? 0.5
        : 1};"
      use:draggable={{
        position: { x: col * gridWidth, y: row * gridWidth },
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
  .svg-element {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }
  .ship {
    position: absolute;
    background-color: black;
    border-radius: 3px;
    z-index: 2;
  }
</style>
