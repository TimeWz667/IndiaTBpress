<template>
  <div>
    {{ Data }}
  </div>
</template>

<script>
import data from "../public/Targets.json";

export default {
  name: "inputs",
  data: function() {
    return {
      Data: data
    }
  }
}
</script>


<style scoped>

</style>