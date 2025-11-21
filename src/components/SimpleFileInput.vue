<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  label: String,
  buttonText: {
    type: String,
    default: 'Choose File',
  },
  accept: String,
  helperText: String,
  existingFileName: String,
})

const emit = defineEmits(['file-selected'])

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  selectedFile.value = file
  emit('file-selected', file)
}

const currentFileName = computed(() => {
  if (selectedFile.value) return selectedFile.value.name
  return props.existingFileName || ''
})

const placeholderText = computed(() =>
  props.existingFileName ? 'No file chosen' : 'No file selected',
)
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium">
      {{ label }}
    </label>

    <div class="relative inline-block">
      <!-- The REAL file input, fully Chrome-safe -->
      <input
        ref="fileInput"
        type="file"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        :accept="accept"
        @change="onFileSelected"
      />

      <!-- Custom styled button -->
      <button
        type="button"
        class="px-4 py-2 bg-green-600 text-white text-sm rounded shadow hover:bg-green-700 active:bg-green-800 transition-all flex items-center justify-center gap-2 z-10 relative whitespace-nowrap"
      >
        {{ buttonText }}
      </button>
    </div>

    <div v-if="currentFileName || helperText" class="flex flex-col gap-0.5">
      <p v-if="currentFileName" class="text-sm text-gray-600 leading-tight">
        {{ currentFileName }}
      </p>
      <p v-else class="text-sm text-gray-400 leading-tight">
        {{ placeholderText }}
      </p>
      <p v-if="helperText" class="text-xs text-gray-500 leading-tight">
        {{ helperText }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Ensure surrounding layout is stable */
.relative {
  position: relative;
}
</style>
