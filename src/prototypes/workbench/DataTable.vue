<script setup lang="ts">
import { fields, worksheetRows } from './prototypeState'
</script>

<template>
  <el-table :data="worksheetRows" height="100%" stripe class="prototype-table">
    <el-table-column type="index" label="#" width="54" />
    <el-table-column v-for="field in fields" :key="field.value" :prop="field.value" :label="field.label" min-width="100" />
  </el-table>
</template>
