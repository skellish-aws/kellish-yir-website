<template>
  <div class="p-4">
    <h2 class="text-2xl mb-4">Newsletter Admin</h2>
    <Button label="Add Newsletter" icon="pi pi-plus" class="mb-4" @click="showAddDialog" />
    <Button
      label="Test"
      icon="pi pi-cog"
      class="mb-4 ml-2 p-button-secondary"
      @click="testDialogVisible = true"
    />

    <div v-if="loading" class="flex justify-center">
      <ProgressSpinner />
    </div>

    <!-- Header Row -->
    <div
      class="flex items-center gap-4 p-4 bg-gray-100 border rounded-lg font-semibold text-sm text-gray-700"
    >
      <input
        type="checkbox"
        :checked="selectedNewsletters.length === newsletters.length && newsletters.length > 0"
        @change="toggleAllNewsletters"
        class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />
      <div class="flex-1">Newsletter</div>
      <div class="flex gap-6 items-center">
        <div class="text-center w-20">
          <span class="text-xs">Card</span>
        </div>
        <div class="text-center w-20">
          <span class="text-xs">Newsletter</span>
        </div>
      </div>
      <div class="w-32 text-center">Actions</div>
    </div>

    <!-- Newsletter List -->
    <div class="space-y-2">
      <div
        v-for="newsletter in newsletters"
        :key="newsletter.id"
        class="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <!-- Checkbox -->
        <input
          type="checkbox"
          :value="newsletter.id"
          v-model="selectedNewsletters"
          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />

        <!-- Year & Title -->
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-lg text-gray-900 truncate">{{ newsletter.title }}</h3>
          <span class="text-sm text-gray-500">{{ newsletter.year }}</span>
        </div>

        <!-- Previews -->
        <div class="flex gap-6 items-center">
          <!-- Card Preview -->
          <div class="text-center">
            <span class="text-xs text-gray-500 block mb-1">Card</span>
            <div class="relative w-20 h-28 mx-auto">
              <img
                v-if="newsletter.cardImageUrl"
                :src="newsletter.cardImageUrl"
                class="absolute inset-0 w-full h-full object-contain border rounded shadow-sm"
                :alt="`${newsletter.title} card`"
              />
              <div
                v-else
                class="absolute inset-0 w-full h-full border-2 border-dashed border-gray-300 rounded bg-gray-50 flex flex-col items-center justify-center"
              >
                <i class="pi pi-image text-gray-400 text-lg mb-1"></i>
                <span class="text-xs text-gray-400 text-center px-1">No card</span>
              </div>
            </div>
          </div>

          <!-- Newsletter Preview -->
          <div class="text-center">
            <span class="text-xs text-gray-500 block mb-1">Newsletter</span>
            <div class="relative w-20 h-28 mx-auto">
              <img
                v-if="newsletter.pdfThumbnailUrl"
                :src="newsletter.pdfThumbnailUrl"
                class="absolute inset-0 w-full h-full object-contain border rounded shadow-sm"
                :alt="`${newsletter.title} newsletter preview`"
              />
              <div
                v-else
                class="absolute inset-0 w-full h-full border-2 border-dashed border-gray-300 rounded bg-gray-50 flex flex-col items-center justify-center"
              >
                <i class="pi pi-file-pdf text-gray-400 text-lg mb-1"></i>
                <span class="text-xs text-gray-400 text-center px-1">No PDF</span>
              </div>
            </div>
            <span v-if="newsletter.pdfPageCount" class="text-xs text-gray-500 mt-1 block">
              {{ newsletter.pdfPageCount }} page{{ newsletter.pdfPageCount > 1 ? 's' : '' }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 items-center">
          <button
            @click="editNewsletter(newsletter)"
            class="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors"
            title="Edit newsletter"
          >
            ✏️ Edit
          </button>
          <button
            @click="removeNewsletter(newsletter)"
            class="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium transition-colors"
            title="Delete newsletter"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-4 mb-4">
      <Button
        :label="`Delete Selected (${selectedNewsletters.length})`"
        icon="pi pi-trash"
        class="p-button-danger"
        :disabled="selectedNewsletters.length === 0"
        @click="confirmDeleteSelected"
      />
      <span v-if="selectedNewsletters.length > 0" class="text-sm text-gray-600">
        {{ selectedNewsletters.length }} of {{ newsletters.length }} newsletters selected
      </span>
    </div>

    <Dialog v-model:visible="deleteDialogVisible" header="Confirm Delete" modal>
      <span>Are you sure you want to delete {{ selectedNewsletters.length }} newsletter(s)?</span>
      <template #footer>
        <Button label="Cancel" @click="deleteDialogVisible = false" />
        <Button label="Delete" class="p-button-danger" @click="deleteSelectedNewsletters" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="testDialogVisible"
      header="Confirm Test"
      modal
      :style="{ width: '320px', borderRadius: '16px', background: '#ede6f3' }"
      :pt="{
        root: { style: { background: '#ede6f3', borderRadius: '16px' } },
        header: { style: { fontSize: '1.3rem', fontWeight: 500, color: '#222' } },
      }"
    >
      <div class="mb-4" style="color: #222">
        <div>Are you sure you want to test this newsletter set?</div>
        <div class="mt-4" style="color: #444">This action cannot be undone</div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          class="p-button-text"
          style="color: #7c3aed"
          @click="testDialogVisible = false"
        />
        <Button label="Test" class="p-button-text" style="color: #7c3aed" @click="testNewsletter" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="dialogVisible"
      header="Create Newsletter Set"
      modal
      :style="{ minWidth: '800px', maxWidth: '900px' }"
      @hide="resetDialog"
    >
      <div class="p-fluid">
        <!-- Year and Title -->
        <div class="grid grid-cols-2 gap-4 mb-6 items-end">
          <div>
            <label for="year" class="block mb-1">Year:</label>
            <InputNumber
              id="year"
              v-model="form.year"
              :useGrouping="false"
              required
              class="w-full"
            />
          </div>
          <div>
            <label for="title" class="block mb-1">Title:</label>
            <InputText id="title" v-model="form.title" required class="w-full" />
          </div>
        </div>

        <!-- Newsletter PDF and Card Image Sections -->
        <div class="grid grid-cols-2 gap-6">
          <!-- Newsletter PDF -->
          <div class="p-4 border rounded bg-gray-50">
            <h3 class="font-semibold mb-2">Newsletter PDF</h3>
            <div class="flex flex-col gap-2 mb-2">
              <div class="flex items-center gap-2">
                <label for="pdfWidthIn" class="mb-0">Width (in.):</label>
                <InputNumber
                  id="pdfWidthIn"
                  v-model="form.pdfWidthIn"
                  :step="0.01"
                  :min="0"
                  required
                  class="w-full"
                  style="max-width: 80px"
                />
              </div>
              <div class="flex items-center gap-2">
                <label for="pdfHeightIn" class="mb-0">Height (in.):</label>
                <InputNumber
                  id="pdfHeightIn"
                  v-model="form.pdfHeightIn"
                  :step="0.01"
                  :min="0"
                  required
                  class="w-full"
                  style="max-width: 80px"
                />
              </div>
            </div>
            <div class="flex items-center gap-4 mt-2">
              <FileUpload
                mode="basic"
                name="pdfFile"
                accept="application/pdf"
                :auto="false"
                chooseLabel="Select PDF"
                @select="onPdfSelect"
                :maxFileSize="100000000"
              />
              <img
                v-if="pdfThumbnail"
                :src="pdfThumbnail"
                class="w-24 h-32 object-contain border rounded"
              />
            </div>
          </div>

          <!-- Card Image -->
          <div class="p-4 border rounded bg-gray-50">
            <h3 class="font-semibold mb-2">Card Image</h3>
            <div class="flex flex-col gap-2 mb-2">
              <div class="flex items-center gap-2">
                <label for="cardWidthIn" class="mb-0">Width (in.):</label>
                <InputNumber
                  id="cardWidthIn"
                  v-model="form.cardWidthIn"
                  :step="0.01"
                  :min="0"
                  required
                  class="w-full"
                  style="max-width: 80px"
                />
              </div>
              <div class="flex items-center gap-2">
                <label for="cardHeightIn" class="mb-0">Height (in.):</label>
                <InputNumber
                  id="cardHeightIn"
                  v-model="form.cardHeightIn"
                  :step="0.01"
                  :min="0"
                  required
                  class="w-full"
                  style="max-width: 80px"
                />
              </div>
            </div>
            <div class="flex items-center gap-4 mt-2">
              <FileUpload
                mode="basic"
                name="cardImage"
                accept="image/*"
                :auto="false"
                chooseLabel="Select Card"
                @select="onImageSelect"
                :maxFileSize="5000000"
              />
              <img
                v-if="cardThumbnail"
                :src="cardThumbnail"
                class="w-24 h-32 object-contain border rounded"
              />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" class="p-button-text" @click="resetDialog" />
        <Button label="Create" icon="pi pi-check" @click="saveNewsletter" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import FileUpload from 'primevue/fileupload'
import InputText from 'primevue/inputtext'

import type { Schema } from '@amplify/data/resource'
import { generateClient } from 'aws-amplify/api'
import { uploadData, getUrl, remove } from 'aws-amplify/storage'
import { createThumbnail } from '../utils/thumbnailGenerator'
import * as pdfjs from 'pdfjs-dist'
import { generatePdfThumbnail } from '../utils/pdfThumbnail'

const deleteDialogVisible = ref(false)
const testDialogVisible = ref(false)

function loadNewsletterUrls(newsletter: Newsletter) {
  if (!newsletter.id) return
  const id = newsletter.id
  if (newsletter.hasCardImage) {
    getFileUrl(id, 'card-thumbnail')
      .then((url) => {
        if (url) newsletter.cardImageUrl = url
        else return getFileUrl(id, 'card')
      })
      .then((url) => {
        if (url) newsletter.cardImageUrl = url
      })
      .catch(() => {
        newsletter.cardImageUrl = '/placeholder-image.png'
      })
  }
  getFileUrl(id, 'newsletter-thumbnail')
    .then((url) => {
      if (url) newsletter.pdfThumbnailUrl = url
      else newsletter.pdfThumbnailUrl = '/placeholder-pdf.png'
    })
    .catch(() => {
      newsletter.pdfThumbnailUrl = '/placeholder-pdf.png'
    })
  getFileUrl(id, 'newsletter')
    .then((url) => {
      if (url) newsletter.pdfUrl = url
    })
    .catch(() => {
      newsletter.pdfUrl = ''
    })
}

interface Newsletter {
  id?: string
  title: string
  year: number
  hasCardImage?: boolean
  cardImageUrl?: string
  pdfUrl?: string
  pdfThumbnailUrl?: string
  cardWidthIn?: number
  cardHeightIn?: number
  pdfWidthIn?: number
  pdfHeightIn?: number
  pdfPageCount?: number
}

interface CreateNewsletterInput {
  title: string
  year: number
  hasCardImage?: boolean
  cardWidthIn?: number
  cardHeightIn?: number
  pdfWidthIn?: number
  pdfHeightIn?: number
}

interface UpdateNewsletterInput {
  id: string
  title: string
  year: number
  hasCardImage?: boolean
  cardWidthIn?: number
  cardHeightIn?: number
  pdfWidthIn?: number
  pdfHeightIn?: number
}

const client = generateClient<Schema>()

const newsletters = ref<Newsletter[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const pdfFile = ref<File | null>(null)
const cardImageFile = ref<File | null>(null)
const pdfThumbnail = ref<string | null>(null)
const cardThumbnail = ref<string | null>(null)
const selectedNewsletters = ref<string[]>([])

function getFileKey(
  newsletterId: string,
  fileType: 'newsletter' | 'newsletter-thumbnail' | 'card' | 'card-thumbnail',
): string {
  return `newsletters/${newsletterId}-${fileType}`
}

async function getFileUrl(
  newsletterId: string,
  fileType: 'newsletter' | 'newsletter-thumbnail' | 'card' | 'card-thumbnail',
): Promise<string> {
  try {
    const key = getFileKey(newsletterId, fileType)
    const result = await getUrl({ path: key })
    return result.url.toString()
  } catch (error) {
    console.error(`Error getting URL for ${fileType}:`, error)
    return ''
  }
}

const form = ref<Partial<Newsletter>>({
  title: '',
  year: new Date().getFullYear(),
  cardWidthIn: undefined,
  cardHeightIn: undefined,
  pdfWidthIn: undefined,
  pdfHeightIn: undefined,
  pdfPageCount: undefined,
})

async function onPdfSelect(event: { files: File[] }) {
  pdfFile.value = event.files[0]
  const arrayBuffer = await pdfFile.value.arrayBuffer()
  const loadingTask = pdfjs.getDocument(arrayBuffer)
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1.0 })
  const widthInches = viewport.width / 72
  const heightInches = viewport.height / 72
  form.value.pdfWidthIn = parseFloat(widthInches.toFixed(2))
  form.value.pdfHeightIn = parseFloat(heightInches.toFixed(2))
  form.value.pdfPageCount = pdf.numPages
  if (pdfFile.value) {
    const thumbnail = await generateThumbnail(pdfFile.value)
    if (thumbnail) {
      pdfThumbnail.value = URL.createObjectURL(thumbnail)
    }
  }
}

async function onImageSelect(event: { files: File[] }) {
  cardImageFile.value = event.files[0]
  const img = new window.Image()
  img.onload = () => {
    form.value.cardWidthIn = parseFloat((img.width / 96).toFixed(2))
    form.value.cardHeightIn = parseFloat((img.height / 96).toFixed(2))
  }
  img.src = URL.createObjectURL(cardImageFile.value)
  if (cardImageFile.value) {
    const thumbnail = await generateThumbnail(cardImageFile.value)
    if (thumbnail) {
      cardThumbnail.value = URL.createObjectURL(thumbnail)
    }
  }
}

async function fetchNewsletters() {
  loading.value = true
  try {
    const { data, errors } = await client.models.Newsletter.list()
    if (errors) {
      console.error('Errors fetching newsletters:', errors)
      return
    }
    newsletters.value = data as Newsletter[]
    for (const newsletter of newsletters.value) {
      loadNewsletterUrls(newsletter)
    }
  } catch (err) {
    console.error('Error loading newsletters:', err)
  } finally {
    loading.value = false
  }
}

function showAddDialog() {
  const year = new Date().getFullYear()
  form.value = {
    title: `${year} Kellish YIR`,
    year: year,
    cardWidthIn: undefined,
    cardHeightIn: undefined,
    pdfWidthIn: undefined,
    pdfHeightIn: undefined,
    pdfPageCount: undefined,
  }
  pdfFile.value = null
  cardImageFile.value = null
  pdfThumbnail.value = null
  cardThumbnail.value = null
  isEditing.value = false
  dialogVisible.value = true
}

async function generateThumbnail(file: File): Promise<Blob | null> {
  try {
    if (file.type.startsWith('image/')) {
      return await createThumbnail(file, 200, 200)
    } else if (file.type === 'application/pdf') {
      return await generatePdfThumbnail(file)
    }
    return null
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return null
  }
}

function editNewsletter(n: Newsletter) {
  form.value = { ...n }
  pdfFile.value = null
  cardImageFile.value = null
  pdfThumbnail.value = null
  cardThumbnail.value = null
  isEditing.value = true
  dialogVisible.value = true
}

async function uploadFile(
  file: File,
  newsletterId: string,
  fileType: 'newsletter' | 'card',
): Promise<void> {
  try {
    const fileKey = getFileKey(newsletterId, fileType)
    await uploadData({
      path: fileKey,
      data: file,
      options: {
        contentType: file.type,
        // access: 'protected', // Remove if not supported by your storage config
      },
    }).result
    const thumbnail = await generateThumbnail(file)
    if (thumbnail) {
      const thumbnailKey = getFileKey(
        newsletterId,
        `${fileType}-thumbnail` as 'newsletter-thumbnail' | 'card-thumbnail',
      )
      await uploadData({
        path: thumbnailKey,
        data: thumbnail,
        options: {
          contentType: 'image/jpeg',
        },
      }).result
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

async function saveNewsletter() {
  try {
    saving.value = true
    const newsletterId = form.value.id || `newsletter_${Date.now()}`
    let hasCardImage = form.value.hasCardImage || false
    if (pdfFile.value) {
      await uploadFile(pdfFile.value, newsletterId, 'newsletter')
    }
    if (cardImageFile.value) {
      await uploadFile(cardImageFile.value, newsletterId, 'card')
      hasCardImage = true
    }
    if (isEditing.value && form.value.id) {
      await client.models.Newsletter.update({
        id: form.value.id,
        title: form.value.title || '',
        year: form.value.year || new Date().getFullYear(),
        hasCardImage,
        cardWidthIn: form.value.cardWidthIn,
        cardHeightIn: form.value.cardHeightIn,
        pdfWidthIn: form.value.pdfWidthIn,
        pdfHeightIn: form.value.pdfHeightIn,
      } as UpdateNewsletterInput)
    } else {
      await client.models.Newsletter.create({
        id: newsletterId,
        title: form.value.title || '',
        year: form.value.year || new Date().getFullYear(),
        hasCardImage,
        cardWidthIn: form.value.cardWidthIn,
        cardHeightIn: form.value.cardHeightIn,
        pdfWidthIn: form.value.pdfWidthIn,
        pdfHeightIn: form.value.pdfHeightIn,
      } as CreateNewsletterInput)
    }
    await fetchNewsletters()
    resetDialog()
  } catch (err) {
    console.error('Error saving newsletter:', err)
    alert('Error saving newsletter. Please try again.')
  } finally {
    saving.value = false
  }
}

async function removeNewsletter(n: Newsletter) {
  if (!n.id) {
    console.error('Cannot delete newsletter without ID')
    return
  }
  if (!confirm(`Delete newsletter from ${n.year}?`)) return
  try {
    await client.models.Newsletter.delete({ id: n.id })
    await fetchNewsletters()
  } catch (err) {
    console.error('Error deleting newsletter:', err)
  }
}

function resetDialog() {
  dialogVisible.value = false
  isEditing.value = false
  const year = new Date().getFullYear()
  form.value = {
    title: `${year} Kellish YIR`,
    year: year,
    cardWidthIn: undefined,
    cardHeightIn: undefined,
    pdfWidthIn: undefined,
    pdfHeightIn: undefined,
    pdfPageCount: undefined,
  }
  pdfFile.value = null
  cardImageFile.value = null
  pdfThumbnail.value = null
  cardThumbnail.value = null
  saving.value = false
}

function confirmDeleteSelected() {
  deleteDialogVisible.value = true
}

async function deleteSelectedNewsletters() {
  deleteDialogVisible.value = false
  for (const id of selectedNewsletters.value) {
    await deleteNewsletterFilesFromS3(id)
    await client.models.Newsletter.delete({ id })
  }
  newsletters.value = newsletters.value.filter(
    (n) => n.id && !selectedNewsletters.value.includes(n.id),
  )
  selectedNewsletters.value = []
}

async function deleteNewsletterFilesFromS3(newsletterId: string) {
  const fileTypes = ['newsletter', 'newsletter-thumbnail', 'card', 'card-thumbnail'] as const
  for (const type of fileTypes) {
    const key = getFileKey(newsletterId, type)
    try {
      await remove({ path: key })
    } catch (e) {
      console.warn(`Could not delete S3 file: ${key}`, e)
    }
  }
}

function testNewsletter() {
  testDialogVisible.value = false
}

function toggleAllNewsletters() {
  if (selectedNewsletters.value.length === newsletters.value.length) {
    // If all are selected, deselect all
    selectedNewsletters.value = []
  } else {
    // If not all are selected, select all
    selectedNewsletters.value = newsletters.value.map((n) => n.id).filter(Boolean) as string[]
  }
}

onMounted(fetchNewsletters)
</script>

<style>
/* Hide filename in PrimeVue FileUpload basic mode */
.p-fileupload-filename {
  display: none !important;
}
</style>
