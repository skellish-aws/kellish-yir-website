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

    <!-- Newsletter List -->
    <div class="space-y-4">
      <!-- Empty State -->
      <div
        v-if="!loading && newsletters.length === 0"
        class="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
      >
        <i class="pi pi-inbox text-gray-400 text-5xl mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">No newsletters yet</h3>
        <p class="text-sm text-gray-500 text-center mb-4">
          Get started by uploading your first newsletter.
        </p>
        <Button label="Add Newsletter" icon="pi pi-plus" @click="showAddDialog" class="mt-2" />
      </div>

      <!-- Bulk Actions -->
      <div v-if="!loading && newsletters.length > 0" class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="selectedNewsletters.length === newsletters.length && newsletters.length > 0"
            @change="toggleAllNewsletters"
            class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span class="text-sm text-gray-600">
            Select all ({{ selectedNewsletters.length }} of {{ newsletters.length }} selected)
          </span>
        </div>
        <Button
          v-if="selectedNewsletters.length > 0"
          :label="`Delete Selected (${selectedNewsletters.length})`"
          icon="pi pi-trash"
          class="p-button-danger"
          @click="confirmDeleteSelected"
        />
      </div>

      <!-- Newsletter Cards Grid -->
      <div
        v-if="!loading && newsletters.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="newsletter in newsletters"
          :key="newsletter.id"
          class="border rounded-lg bg-white hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
        >
          <!-- Card Header -->
          <div class="p-3 border-b bg-gray-50 flex items-start justify-between gap-2">
            <div class="flex items-start gap-2 flex-1 min-w-0">
              <input
                type="checkbox"
                :value="newsletter.id"
                v-model="selectedNewsletters"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                :aria-label="`Select ${newsletter.title}`"
              />
              <div class="flex-1 min-w-0">
                <h3
                  class="font-semibold text-base text-gray-900 truncate"
                  :title="newsletter.title"
                >
                  {{ newsletter.title }}
                </h3>
                <span class="text-xs text-gray-500">{{ newsletter.year }}</span>
              </div>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <button
                @click="editNewsletter(newsletter)"
                class="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                :aria-label="`Edit ${newsletter.title}`"
                title="Edit newsletter"
              >
                <i class="pi pi-pencil text-sm" aria-hidden="true"></i>
              </button>
              <button
                @click="removeNewsletter(newsletter)"
                class="p-2 text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                :aria-label="`Delete ${newsletter.title}`"
                title="Delete newsletter"
              >
                <i class="pi pi-trash text-sm" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4 flex-1">
            <div class="grid grid-cols-2 gap-4">
              <!-- Card Preview -->
              <div>
                <div class="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                  Card
                </div>
                <div class="flex gap-1.5">
                  <!-- Card Front -->
                  <div
                    class="relative w-20 h-28 flex-shrink-0 rounded border bg-gray-50 overflow-hidden"
                  >
                    <img
                      v-if="newsletter.cardImageUrl"
                      :src="newsletter.cardImageUrl"
                      class="absolute inset-0 w-full h-full object-contain"
                      :alt="`${newsletter.title} card front`"
                    />
                    <div
                      v-else
                      class="absolute inset-0 w-full h-full border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center"
                    >
                      <i class="pi pi-image text-gray-400 text-sm mb-1" aria-hidden="true"></i>
                      <span class="text-[10px] text-gray-400 text-center px-1">No card</span>
                    </div>
                  </div>
                  <!-- Card Back -->
                  <div
                    v-if="newsletter.cardBackImageUrl"
                    class="relative w-20 h-28 flex-shrink-0 rounded border bg-gray-50 overflow-hidden"
                  >
                    <img
                      :src="newsletter.cardBackImageUrl"
                      class="absolute inset-0 w-full h-full object-contain"
                      :alt="`${newsletter.title} card back`"
                    />
                  </div>
                </div>
                <div
                  v-if="newsletter.cardFrontSizeMB || newsletter.cardBackSizeMB"
                  class="mt-1.5 space-y-0.5"
                >
                  <span v-if="newsletter.cardFrontSizeMB" class="text-xs text-gray-400 block">
                    Front: {{ newsletter.cardFrontSizeMB.toFixed(2) }} MB
                  </span>
                  <span v-if="newsletter.cardBackSizeMB" class="text-xs text-gray-400 block">
                    Back: {{ newsletter.cardBackSizeMB.toFixed(2) }} MB
                  </span>
                </div>
              </div>

              <!-- Newsletter Preview -->
              <div>
                <div class="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                  Newsletter
                </div>
                <div class="relative w-20 h-28 rounded border bg-gray-50 overflow-hidden">
                  <img
                    v-if="newsletter.pdfThumbnailUrl"
                    :src="newsletter.pdfThumbnailUrl"
                    class="absolute inset-0 w-full h-full object-contain"
                    :alt="`${newsletter.title} newsletter preview`"
                  />
                  <div
                    v-else
                    class="absolute inset-0 w-full h-full border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center"
                  >
                    <i class="pi pi-file-pdf text-gray-400 text-sm mb-1" aria-hidden="true"></i>
                    <span class="text-[10px] text-gray-400 text-center px-1">No PDF</span>
                  </div>
                </div>
                <div
                  v-if="newsletter.pdfPageCount || newsletter.pdfSizeMB"
                  class="mt-1.5 space-y-0.5"
                >
                  <span
                    v-if="newsletter.pdfPageCount"
                    class="text-xs text-gray-500 block font-medium"
                  >
                    {{ newsletter.pdfPageCount }} page{{ newsletter.pdfPageCount > 1 ? 's' : '' }}
                  </span>
                  <span v-if="newsletter.pdfSizeMB" class="text-xs text-gray-400 block">
                    {{ newsletter.pdfSizeMB.toFixed(2) }} MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      :header="isEditing ? `Edit ${form.year} Newsletter Set` : 'Create Newsletter Set'"
      modal
      :style="{
        width: '900px',
      }"
      :pt="{
        root: {
          style: {
            height: '800px', // FIXED HEIGHT (tweak to taste)
          },
        },
        content: {
          style: {
            height: 'calc(800px - 60px)', // header height subtracted
            overflow: 'hidden', // NO scrollbars allowed
          },
        },
      }"
      @hide="resetDialog"
    >
      <div class="p-fluid">
        <!-- Year and Title -->
        <div class="grid grid-cols-2 gap-6 mb-6 items-end">
          <div>
            <label for="year" class="block mb-1 text-gray-700 dark:text-gray-300">Year:</label>
            <Calendar
              id="year"
              v-model="yearDate"
              view="year"
              dateFormat="yy"
              :showIcon="true"
              required
              style="width: 120px"
              inputId="year-input"
            />
          </div>
          <div>
            <label for="title" class="block mb-1 text-gray-700 dark:text-gray-300">Title:</label>
            <InputText id="title" v-model="form.title" required class="w-full" />
          </div>
        </div>

        <!-- Newsletter PDF and Card Image Sections -->
        <div class="grid grid-cols-2 gap-6">
          <!-- Newsletter PDF -->
          <div
            class="p-4 border rounded bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <h3 class="font-semibold mb-2 text-gray-900 dark:text-gray-100">Newsletter PDF</h3>
            <div class="inline-flex items-center gap-3 mb-2">
              <label
                for="pdfWidthIn"
                class="mb-0 w-20 text-right text-sm text-gray-700 dark:text-gray-300"
                >Width (in.):</label
              >
              <div class="size-input-wrapper">
                <InputNumber
                  id="pdfWidthIn"
                  v-model="form.pdfWidthIn"
                  :step="0.01"
                  :min="0"
                  required
                  :pt="{
                    root: { style: { width: '90px', maxWidth: '90px', flexShrink: 0 } },
                    input: {
                      style: {
                        textAlign: 'right',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      },
                    },
                  }"
                />
              </div>
              <label
                for="pdfHeightIn"
                class="mb-0 w-20 text-right text-sm ml-2 text-gray-700 dark:text-gray-300"
                >Height (in.):</label
              >
              <div class="size-input-wrapper">
                <InputNumber
                  id="pdfHeightIn"
                  v-model="form.pdfHeightIn"
                  :step="0.01"
                  :min="0"
                  required
                  :pt="{
                    root: { style: { width: '90px', maxWidth: '90px', flexShrink: 0 } },
                    input: {
                      style: {
                        textAlign: 'right',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      },
                    },
                  }"
                />
              </div>
            </div>
            <div class="mb-4">
              <div class="flex items-start gap-2">
                <div class="flex flex-col gap-2 min-w-[260px]">
                  <SimpleFileInput
                    label="Newsletter PDF:"
                    :buttonText="pdfThumbnail ? 'Replace PDF' : 'Select PDF'"
                    accept="application/pdf"
                    :helperText="
                      pdfThumbnail && !pdfFile
                        ? `PDF file exists${existingPdfSize ? ' (' + existingPdfSize + ')' : ''} - select new file to replace`
                        : undefined
                    "
                    @file-selected="onPdfSelect"
                  />
                </div>
                <div class="w-28 h-40 flex-shrink-0 mt-6">
                  <img
                    v-if="pdfThumbnail"
                    :src="pdfThumbnail"
                    :alt="`${form.title || 'Newsletter'} PDF preview`"
                    class="w-full h-full object-contain border rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Card Images -->
          <div
            class="p-4 border rounded bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <h3 class="font-semibold mb-2 text-gray-900 dark:text-gray-100">Card Images</h3>
            <div class="inline-flex items-center gap-3 mb-2">
              <label
                for="cardWidthIn"
                class="mb-0 w-20 text-right text-sm text-gray-700 dark:text-gray-300"
                >Width (in.):</label
              >
              <div class="size-input-wrapper">
                <InputNumber
                  id="cardWidthIn"
                  v-model="form.cardWidthIn"
                  :step="0.01"
                  :min="0"
                  required
                  :pt="{
                    root: { style: { width: '90px', maxWidth: '90px', flexShrink: 0 } },
                    input: {
                      style: {
                        textAlign: 'right',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      },
                    },
                  }"
                />
              </div>
              <label
                for="cardHeightIn"
                class="mb-0 w-20 text-right text-sm ml-2 text-gray-700 dark:text-gray-300"
                >Height (in.):</label
              >
              <div class="size-input-wrapper">
                <InputNumber
                  id="cardHeightIn"
                  v-model="form.cardHeightIn"
                  :step="0.01"
                  :min="0"
                  required
                  :pt="{
                    root: { style: { width: '90px', maxWidth: '90px', flexShrink: 0 } },
                    input: {
                      style: {
                        textAlign: 'right',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      },
                    },
                  }"
                />
              </div>
            </div>

            <!-- Card Front -->
            <div class="mb-4">
              <div class="flex items-start gap-2">
                <div class="flex flex-col gap-2 min-w-[260px]">
                  <SimpleFileInput
                    label="Card Front:"
                    :buttonText="cardThumbnail && !cardImageFile ? 'Replace Front' : 'Select Front'"
                    accept="image/*"
                    @file-selected="onCardFrontSelect"
                  />
                  <!-- Metadata wrapper with consistent spacing -->
                  <div class="mt-1">
                    <div
                      v-if="compressingImage"
                      class="text-sm text-gray-600 flex items-center gap-2 m-0"
                    >
                      <ProgressSpinner style="width: 16px; height: 16px" />
                      <span>Optimizing...</span>
                    </div>
                    <template v-else-if="imageCompressionInfo">
                      <div class="text-xs text-gray-600 m-0">
                        Original: {{ imageCompressionInfo.original }}
                      </div>
                      <div class="text-xs text-green-600 m-0">
                        Optimized: {{ imageCompressionInfo.compressed }}
                      </div>
                    </template>
                    <template v-else-if="cardImageFile && !imageCompressionInfo">
                      <div class="text-xs text-gray-600 m-0">
                        Original: {{ (cardImageFile.size / (1024 * 1024)).toFixed(2) }} MB
                      </div>
                      <div class="text-xs text-green-600 m-0">No optimization needed</div>
                    </template>
                    <div
                      v-else-if="cardThumbnail && !cardImageFile"
                      class="text-xs text-gray-600 m-0"
                    >
                      Card front image exists{{
                        existingCardFrontSize ? ' (' + existingCardFrontSize + ')' : ''
                      }}
                      - select new file to replace
                    </div>
                  </div>
                </div>
                <div class="w-28 h-40 flex-shrink-0 mt-6">
                  <img
                    v-if="cardThumbnail"
                    :src="cardThumbnail"
                    :alt="`${form.title || 'Newsletter'} card front preview`"
                    class="w-full h-full object-contain border rounded"
                  />
                </div>
              </div>
            </div>

            <!-- Card Back -->
            <div class="mb-4">
              <div class="flex items-start gap-2">
                <div class="flex flex-col gap-2 min-w-[260px]">
                  <SimpleFileInput
                    label="Card Back (optional):"
                    :buttonText="
                      cardBackThumbnail && !cardBackImageFile ? 'Replace Back' : 'Select Back'
                    "
                    accept="image/*"
                    @file-selected="onCardBackSelect"
                  />
                  <!-- Metadata wrapper with consistent spacing -->
                  <div class="mt-1">
                    <div
                      v-if="compressingBackImage"
                      class="text-sm text-gray-600 flex items-center gap-2 m-0"
                    >
                      <ProgressSpinner style="width: 16px; height: 16px" />
                      <span>Optimizing...</span>
                    </div>
                    <template v-else-if="imageBackCompressionInfo">
                      <div class="text-xs text-gray-600 m-0">
                        Original: {{ imageBackCompressionInfo.original }}
                      </div>
                      <div class="text-xs text-green-600 m-0">
                        Optimized: {{ imageBackCompressionInfo.compressed }}
                      </div>
                    </template>
                    <template v-else-if="cardBackImageFile && !imageBackCompressionInfo">
                      <div class="text-xs text-gray-600 m-0">
                        Original: {{ (cardBackImageFile.size / (1024 * 1024)).toFixed(2) }} MB
                      </div>
                      <div class="text-xs text-green-600 m-0">No optimization needed</div>
                    </template>
                    <div
                      v-else-if="cardBackThumbnail && !cardBackImageFile"
                      class="text-xs text-gray-600 m-0"
                    >
                      Card back image exists{{
                        existingCardBackSize ? ' (' + existingCardBackSize + ')' : ''
                      }}
                      - select new file to replace
                    </div>
                  </div>
                </div>
                <div class="w-28 h-40 flex-shrink-0 mt-6">
                  <img
                    v-if="cardBackThumbnail"
                    :src="cardBackThumbnail"
                    :alt="`${form.title || 'Newsletter'} card back preview`"
                    class="w-full h-full object-contain border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" class="p-button-text" @click="resetDialog" />
        <Button
          :label="isEditing ? 'Update' : 'Create'"
          icon="pi pi-check"
          @click="saveNewsletter"
          :loading="saving"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import SimpleFileInput from '@/components/SimpleFileInput.vue'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import { useToast } from 'primevue/usetoast'

import type { Schema } from '@amplify/data/resource'
import { generateClient } from 'aws-amplify/api'
import { uploadData, getUrl, remove } from 'aws-amplify/storage'
import { createThumbnail } from '../utils/thumbnailGenerator'
import * as pdfjs from 'pdfjs-dist'
import { generatePdfThumbnail } from '../utils/pdfThumbnail'
import { optimizeImage } from '../utils/imageOptimizer'
import { readImageDpi, calculatePhysicalDimensions } from '../utils/imageDpiReader'

const deleteDialogVisible = ref(false)
const testDialogVisible = ref(false)

function loadNewsletterUrls(newsletter: Newsletter) {
  if (!newsletter.id) return
  const id = newsletter.id
  if (newsletter.hasCardImage) {
    // Load card front
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

    // Load card back (if exists)
    getFileUrl(id, 'card-back-thumbnail')
      .then((url) => {
        if (url) newsletter.cardBackImageUrl = url
        else return getFileUrl(id, 'card-back')
      })
      .then((url) => {
        if (url) newsletter.cardBackImageUrl = url
      })
      .catch(() => {
        // Card back not found, that's okay (it's optional)
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
  cardBackImageUrl?: string
  pdfUrl?: string
  pdfThumbnailUrl?: string
  cardWidthIn?: number
  cardHeightIn?: number
  pdfWidthIn?: number
  pdfHeightIn?: number
  pdfSizeMB?: number
  cardFrontSizeMB?: number
  cardBackSizeMB?: number
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
  pdfSizeMB?: number
  cardFrontSizeMB?: number
  cardBackSizeMB?: number
  pdfPageCount?: number
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
  pdfSizeMB?: number
  cardFrontSizeMB?: number
  cardBackSizeMB?: number
  pdfPageCount?: number
}

const client = generateClient<Schema>()
const toast = useToast()

const newsletters = ref<Newsletter[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const pdfFile = ref<File | null>(null)
const cardImageFile = ref<File | null>(null)
const cardBackImageFile = ref<File | null>(null)
const pdfThumbnail = ref<string | null>(null)
const cardThumbnail = ref<string | null>(null)
const cardBackThumbnail = ref<string | null>(null)
const selectedNewsletters = ref<string[]>([])
const compressingImage = ref(false)
const compressingBackImage = ref(false)
const imageCompressionInfo = ref<{ original: string; compressed: string } | null>(null)
const imageBackCompressionInfo = ref<{ original: string; compressed: string } | null>(null)
const existingPdfSize = ref<string | null>(null)
const existingCardFrontSize = ref<string | null>(null)
const existingCardBackSize = ref<string | null>(null)

// Configurable family name (for future multi-tenant support)
// TODO: Move to environment config or tenant settings when implementing multi-tenancy
const FAMILY_NAME = 'Kellish'

// Track if user has manually edited the title (to stop auto-generation)
const titleManuallyEdited = ref(false)

function getFileKey(
  newsletterId: string,
  fileType:
    | 'newsletter'
    | 'newsletter-thumbnail'
    | 'card'
    | 'card-thumbnail'
    | 'card-back'
    | 'card-back-thumbnail',
): string {
  return `newsletters/${newsletterId}-${fileType}`
}

async function getFileUrl(
  newsletterId: string,
  fileType:
    | 'newsletter'
    | 'newsletter-thumbnail'
    | 'card'
    | 'card-thumbnail'
    | 'card-back'
    | 'card-back-thumbnail',
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

// Generate title from year and family name
function generateTitle(year: number): string {
  return `${year} ${FAMILY_NAME} Family Year-In-Review`
}

const currentYear = new Date().getFullYear()
const form = ref<Partial<Newsletter>>({
  title: generateTitle(currentYear),
  year: currentYear,
  cardWidthIn: undefined,
  cardHeightIn: undefined,
  pdfWidthIn: undefined,
  pdfHeightIn: undefined,
  pdfPageCount: undefined,
})

// Year picker - sync between Date object (for Calendar) and number (for form.year)
const yearDate = computed({
  get: () => {
    const year = form.value.year || new Date().getFullYear()
    return new Date(year, 0, 1) // January 1st of the selected year
  },
  set: (value: Date | null) => {
    if (value) {
      const newYear = value.getFullYear()
      form.value.year = newYear
      // Auto-generate title if user hasn't manually edited it
      if (!titleManuallyEdited.value) {
        form.value.title = generateTitle(newYear)
      }
    }
  },
})

// Watch for year changes and auto-generate title (if not manually edited)
watch(
  () => form.value.year,
  (newYear) => {
    if (newYear && !titleManuallyEdited.value) {
      form.value.title = generateTitle(newYear)
    }
  },
)

// Watch for title changes to detect manual editing
watch(
  () => form.value.title,
  (newTitle) => {
    // If title doesn't match the auto-generated pattern, user has edited it
    if (newTitle && form.value.year) {
      const expectedTitle = generateTitle(form.value.year)
      if (newTitle !== expectedTitle) {
        titleManuallyEdited.value = true
      }
    }
  },
)

async function onPdfSelect(file: File | null) {
  if (!file) {
    pdfFile.value = null
    return
  }
  pdfFile.value = file
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

async function onCardFrontSelect(file: File | null) {
  if (!file) {
    cardImageFile.value = null
    imageCompressionInfo.value = null
    compressingImage.value = false
    return
  }
  const originalFile = file

  // Read DPI from image file (PNG or JPEG)
  let dpi: number | null = null
  if (
    originalFile.type === 'image/png' ||
    originalFile.type === 'image/jpeg' ||
    originalFile.type === 'image/jpg'
  ) {
    const dpiData = await readImageDpi(originalFile)
    if (dpiData) {
      // Use average DPI (in case x and y differ slightly)
      dpi = (dpiData.xDpi + dpiData.yDpi) / 2
      const imageType = originalFile.type === 'image/png' ? 'PNG' : 'JPEG'
      console.log(
        `Read DPI from ${imageType}: ${dpi.toFixed(2)} (x: ${dpiData.xDpi.toFixed(2)}, y: ${dpiData.yDpi.toFixed(2)})`,
      )
    }
  }

  // Optimize image files if they're large (> 1MB) - do this asynchronously to not block UI
  const isImage = originalFile.type.startsWith('image/')
  if (isImage && originalFile.size > 1 * 1024 * 1024) {
    compressingImage.value = true
    imageCompressionInfo.value = null

    // Show thumbnail immediately with original file for better UX
    const img = new window.Image()
    img.onload = () => {
      console.log(
        `Image dimensions: ${img.naturalWidth}x${img.naturalHeight} pixels, DPI: ${dpi?.toFixed(2) || 'not found'}`,
      )
      const dimensions = calculatePhysicalDimensions(img.naturalWidth, img.naturalHeight, dpi)
      console.log(
        `Calculated physical dimensions: ${dimensions.widthInches.toFixed(2)}" x ${dimensions.heightInches.toFixed(2)}"`,
      )
      form.value.cardWidthIn = parseFloat(dimensions.widthInches.toFixed(2))
      form.value.cardHeightIn = parseFloat(dimensions.heightInches.toFixed(2))
    }
    img.src = URL.createObjectURL(originalFile)
    const thumbnail = await generateThumbnail(originalFile)
    if (thumbnail) {
      cardThumbnail.value = URL.createObjectURL(thumbnail)
    }

    // Optimize in background
    try {
      const optimizedFile = await optimizeImage(originalFile, 1.0) // Target 1MB for web viewing
      cardImageFile.value = optimizedFile

      // Show compression info
      const originalMB = (originalFile.size / (1024 * 1024)).toFixed(2)
      const compressedMB = (optimizedFile.size / (1024 * 1024)).toFixed(2)
      const reduction = (
        ((originalFile.size - optimizedFile.size) / originalFile.size) *
        100
      ).toFixed(1)

      imageCompressionInfo.value = {
        original: `${originalMB} MB`,
        compressed: `${compressedMB} MB (${reduction}% smaller)`,
      }
    } catch (error) {
      console.error('Error optimizing image:', error)
      // Fall back to original file if optimization fails
      cardImageFile.value = originalFile
    } finally {
      compressingImage.value = false
    }
  } else {
    cardImageFile.value = originalFile
    imageCompressionInfo.value = null

    const img = new window.Image()
    img.onload = () => {
      console.log(
        `Image dimensions: ${img.naturalWidth}x${img.naturalHeight} pixels, DPI: ${dpi?.toFixed(2) || 'not found'}`,
      )
      const dimensions = calculatePhysicalDimensions(img.naturalWidth, img.naturalHeight, dpi)
      console.log(
        `Calculated physical dimensions: ${dimensions.widthInches.toFixed(2)}" x ${dimensions.heightInches.toFixed(2)}"`,
      )
      form.value.cardWidthIn = parseFloat(dimensions.widthInches.toFixed(2))
      form.value.cardHeightIn = parseFloat(dimensions.heightInches.toFixed(2))
    }
    img.src = URL.createObjectURL(cardImageFile.value)
    if (cardImageFile.value) {
      const thumbnail = await generateThumbnail(cardImageFile.value)
      if (thumbnail) {
        cardThumbnail.value = URL.createObjectURL(thumbnail)
      }
    }
  }
}

async function onCardBackSelect(file: File | null) {
  if (!file) {
    cardBackImageFile.value = null
    imageBackCompressionInfo.value = null
    compressingBackImage.value = false
    return
  }
  const originalFile = file

  // Read DPI from image file (PNG or JPEG)
  let dpi: number | null = null
  if (
    originalFile.type === 'image/png' ||
    originalFile.type === 'image/jpeg' ||
    originalFile.type === 'image/jpg'
  ) {
    const dpiData = await readImageDpi(originalFile)
    if (dpiData) {
      // Use average DPI (in case x and y differ slightly)
      dpi = (dpiData.xDpi + dpiData.yDpi) / 2
      const imageType = originalFile.type === 'image/png' ? 'PNG' : 'JPEG'
      console.log(
        `Read DPI from ${imageType} (back): ${dpi.toFixed(2)} (x: ${dpiData.xDpi.toFixed(2)}, y: ${dpiData.yDpi.toFixed(2)})`,
      )

      // Update card dimensions if this is the first card image or if front dimensions aren't set
      if (!form.value.cardWidthIn || !form.value.cardHeightIn) {
        const img = new window.Image()
        img.onload = () => {
          const dimensions = calculatePhysicalDimensions(img.naturalWidth, img.naturalHeight, dpi)
          form.value.cardWidthIn = parseFloat(dimensions.widthInches.toFixed(2))
          form.value.cardHeightIn = parseFloat(dimensions.heightInches.toFixed(2))
        }
        img.src = URL.createObjectURL(originalFile)
      }
    }
  }

  // Optimize image files if they're large (> 1MB) - do this asynchronously to not block UI
  const isImage = originalFile.type.startsWith('image/')
  if (isImage && originalFile.size > 1 * 1024 * 1024) {
    compressingBackImage.value = true
    imageBackCompressionInfo.value = null

    // Show thumbnail immediately with original file for better UX
    const thumbnail = await generateThumbnail(originalFile)
    if (thumbnail) {
      cardBackThumbnail.value = URL.createObjectURL(thumbnail)
    }

    // Optimize in background
    try {
      const optimizedFile = await optimizeImage(originalFile, 1.0) // Target 1MB for web viewing
      cardBackImageFile.value = optimizedFile

      // Show compression info
      const originalMB = (originalFile.size / (1024 * 1024)).toFixed(2)
      const compressedMB = (optimizedFile.size / (1024 * 1024)).toFixed(2)
      const reduction = (
        ((originalFile.size - optimizedFile.size) / originalFile.size) *
        100
      ).toFixed(1)

      imageBackCompressionInfo.value = {
        original: `${originalMB} MB`,
        compressed: `${compressedMB} MB (${reduction}% smaller)`,
      }
    } catch (error) {
      console.error('Error optimizing back image:', error)
      // Fall back to original file if optimization fails
      cardBackImageFile.value = originalFile
    } finally {
      compressingBackImage.value = false
    }
  } else {
    cardBackImageFile.value = originalFile
    imageBackCompressionInfo.value = null

    if (cardBackImageFile.value) {
      const thumbnail = await generateThumbnail(cardBackImageFile.value)
      if (thumbnail) {
        cardBackThumbnail.value = URL.createObjectURL(thumbnail)
      }
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
  titleManuallyEdited.value = false // Reset manual edit flag for new newsletter
  form.value = {
    title: generateTitle(year),
    year: year,
    cardWidthIn: undefined,
    cardHeightIn: undefined,
    pdfWidthIn: undefined,
    pdfHeightIn: undefined,
    pdfPageCount: undefined,
  }
  pdfFile.value = null
  cardImageFile.value = null
  cardBackImageFile.value = null
  pdfThumbnail.value = null
  cardThumbnail.value = null
  cardBackThumbnail.value = null
  imageCompressionInfo.value = null
  imageBackCompressionInfo.value = null
  compressingImage.value = false
  compressingBackImage.value = false
  existingPdfSize.value = null
  existingCardFrontSize.value = null
  existingCardBackSize.value = null
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

async function editNewsletter(n: Newsletter) {
  form.value = { ...n }
  // Check if title matches auto-generated pattern
  if (n.year) {
    const expectedTitle = generateTitle(n.year)
    titleManuallyEdited.value = n.title !== expectedTitle
  } else {
    titleManuallyEdited.value = true // Assume edited if no year
  }
  pdfFile.value = null
  cardImageFile.value = null
  cardBackImageFile.value = null
  pdfThumbnail.value = null
  cardThumbnail.value = null
  cardBackThumbnail.value = null
  imageCompressionInfo.value = null
  imageBackCompressionInfo.value = null
  // Load file sizes from database (stored when files were uploaded)
  if (n.pdfSizeMB) {
    existingPdfSize.value = `${n.pdfSizeMB.toFixed(2)} MB`
  }
  if (n.cardFrontSizeMB) {
    existingCardFrontSize.value = `${n.cardFrontSizeMB.toFixed(2)} MB`
  }
  if (n.cardBackSizeMB) {
    existingCardBackSize.value = `${n.cardBackSizeMB.toFixed(2)} MB`
  }

  // Load existing files and thumbnails if available
  if (n.id) {
    try {
      // Load PDF thumbnail
      const pdfThumbUrl = await getFileUrl(n.id, 'newsletter-thumbnail')
      if (pdfThumbUrl) {
        pdfThumbnail.value = pdfThumbUrl
      } else {
        // Try loading the PDF itself as fallback
        const pdfUrl = await getFileUrl(n.id, 'newsletter')
        if (pdfUrl) {
          pdfThumbnail.value = pdfUrl
        }
      }

      // Load card thumbnails
      const cardThumbUrl = await getFileUrl(n.id, 'card-thumbnail')
      if (cardThumbUrl) {
        cardThumbnail.value = cardThumbUrl
      } else {
        const cardUrl = await getFileUrl(n.id, 'card')
        if (cardUrl) {
          cardThumbnail.value = cardUrl
        }
      }

      const cardBackThumbUrl = await getFileUrl(n.id, 'card-back-thumbnail')
      if (cardBackThumbUrl) {
        cardBackThumbnail.value = cardBackThumbUrl
      } else {
        const cardBackUrl = await getFileUrl(n.id, 'card-back')
        if (cardBackUrl) {
          cardBackThumbnail.value = cardBackUrl
        }
      }
    } catch {
      // Files not found, that's okay
    }
  }

  isEditing.value = true
  dialogVisible.value = true
}

async function uploadFile(
  file: File,
  newsletterId: string,
  fileType: 'newsletter' | 'card' | 'card-back',
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
        `${fileType}-thumbnail` as
          | 'newsletter-thumbnail'
          | 'card-thumbnail'
          | 'card-back-thumbnail',
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

    // Calculate file sizes in MB
    let pdfSizeMB: number | undefined = undefined
    let cardFrontSizeMB: number | undefined = undefined
    let cardBackSizeMB: number | undefined = undefined

    if (pdfFile.value) {
      await uploadFile(pdfFile.value, newsletterId, 'newsletter')
      pdfSizeMB = parseFloat((pdfFile.value.size / (1024 * 1024)).toFixed(2))
    }
    if (cardImageFile.value) {
      await uploadFile(cardImageFile.value, newsletterId, 'card')
      hasCardImage = true
      cardFrontSizeMB = parseFloat((cardImageFile.value.size / (1024 * 1024)).toFixed(2))
    }
    if (cardBackImageFile.value) {
      await uploadFile(cardBackImageFile.value, newsletterId, 'card-back')
      hasCardImage = true
      cardBackSizeMB = parseFloat((cardBackImageFile.value.size / (1024 * 1024)).toFixed(2))
    }

    if (isEditing.value && form.value.id) {
      // When updating, only update sizes if new files were uploaded
      const updateData: UpdateNewsletterInput = {
        id: form.value.id,
        title: form.value.title || '',
        year: form.value.year || new Date().getFullYear(),
        hasCardImage,
        cardWidthIn: form.value.cardWidthIn,
        cardHeightIn: form.value.cardHeightIn,
        pdfWidthIn: form.value.pdfWidthIn,
        pdfHeightIn: form.value.pdfHeightIn,
      }

      // Only update file sizes if new files were uploaded
      if (pdfSizeMB !== undefined) updateData.pdfSizeMB = pdfSizeMB
      if (cardFrontSizeMB !== undefined) updateData.cardFrontSizeMB = cardFrontSizeMB
      if (cardBackSizeMB !== undefined) updateData.cardBackSizeMB = cardBackSizeMB
      // Update page count if a new PDF was uploaded
      if (form.value.pdfPageCount !== undefined) updateData.pdfPageCount = form.value.pdfPageCount

      await client.models.Newsletter.update(updateData)
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
        pdfSizeMB,
        cardFrontSizeMB,
        cardBackSizeMB,
        pdfPageCount: form.value.pdfPageCount,
      } as CreateNewsletterInput)
    }

    // Store editing state before resetting dialog
    const wasEditing = isEditing.value

    await fetchNewsletters()
    resetDialog()

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: wasEditing ? 'Newsletter updated successfully' : 'Newsletter created successfully',
      life: 3000,
    })
  } catch (err) {
    console.error('Error saving newsletter:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save newsletter. Please try again.',
      life: 5000,
    })
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
  titleManuallyEdited.value = false
  const year = new Date().getFullYear()
  form.value = {
    title: generateTitle(year),
    year: year,
    cardWidthIn: undefined,
    cardHeightIn: undefined,
    pdfWidthIn: undefined,
    pdfHeightIn: undefined,
    pdfPageCount: undefined,
  }
  pdfFile.value = null
  cardImageFile.value = null
  cardBackImageFile.value = null
  pdfThumbnail.value = null
  cardThumbnail.value = null
  cardBackThumbnail.value = null
  imageCompressionInfo.value = null
  imageBackCompressionInfo.value = null
  compressingImage.value = false
  compressingBackImage.value = false
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
  const fileTypes = [
    'newsletter',
    'newsletter-thumbnail',
    'card',
    'card-thumbnail',
    'card-back',
    'card-back-thumbnail',
  ] as const
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
/* Fixed width wrapper for dimension input fields */
.size-input-wrapper {
  width: 90px !important;
  min-width: 90px !important;
  max-width: 90px !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
}

/* Ensure PrimeVue InputNumber root doesn't expand beyond wrapper */
.size-input-wrapper :deep(.p-inputnumber) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
}

/* Constrain the actual input element inside InputNumber */
.size-input-wrapper :deep(.p-inputnumber-input) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}

/* Direct targeting of input elements by ID for extra specificity */
/* The ID is on the InputNumber wrapper, so target the input inside it */
#pdfWidthIn .p-inputnumber-input,
#pdfHeightIn .p-inputnumber-input,
#cardWidthIn .p-inputnumber-input,
#cardHeightIn .p-inputnumber-input {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}

/* Also target the wrapper itself */
#pdfWidthIn,
#pdfHeightIn,
#cardWidthIn,
#cardHeightIn {
  width: 90px !important;
  max-width: 90px !important;
  min-width: 90px !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
}

/* Center the newsletter dialog - ensure proper centering */
:deep(.p-dialog-mask) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.p-dialog) {
  margin: 0 !important;
  position: relative !important;
}
</style>
