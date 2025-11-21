<template>
  <div class="home-container">
    <div class="p-4 md:p-6">
      <h1 class="text-3xl font-bold mb-6">Year-in-Review Newsletters</h1>

      <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
        <ProgressSpinner />
      </div>

      <div v-else-if="error" class="mb-4">
        <Message severity="error">{{ error }}</Message>
      </div>

      <div v-else-if="newsletters.length === 0" class="text-center py-12">
        <p class="text-gray-500 text-lg">No newsletters available yet.</p>
      </div>

      <!-- Newsletter Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="newsletter in sortedNewsletters"
          :key="newsletter.id"
          class="newsletter-card bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <!-- Thumbnail -->
          <div class="relative h-64 bg-gray-100">
            <img
              v-if="newsletter.pdfThumbnailUrl"
              :src="newsletter.pdfThumbnailUrl"
              :alt="`${newsletter.title} preview`"
              class="w-full h-full object-contain"
              @error="handleThumbnailError"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-50">
              <i class="pi pi-file-pdf text-6xl text-gray-400"></i>
            </div>
          </div>

          <!-- Card Images (if available) -->
          <div
            v-if="newsletter.hasCardImage && newsletter.cardImageUrl"
            class="p-2 bg-gray-50 border-t"
          >
            <div class="flex gap-2 justify-center">
              <img
                :src="newsletter.cardImageUrl"
                :alt="`${newsletter.title} card`"
                class="h-20 object-contain cursor-pointer hover:opacity-80"
                @click="viewCardImage(newsletter, 'front')"
              />
              <img
                v-if="newsletter.cardBackImageUrl"
                :src="newsletter.cardBackImageUrl"
                :alt="`${newsletter.title} card back`"
                class="h-20 object-contain cursor-pointer hover:opacity-80"
                @click="viewCardImage(newsletter, 'back')"
              />
            </div>
          </div>

          <!-- Newsletter Info -->
          <div class="p-4">
            <h2 class="text-xl font-semibold mb-2">{{ newsletter.title }}</h2>
            <p class="text-sm text-gray-500 mb-4">Year: {{ newsletter.year }}</p>
            <p v-if="newsletter.pdfPageCount" class="text-sm text-gray-500 mb-4">
              {{ newsletter.pdfPageCount }} page{{ newsletter.pdfPageCount > 1 ? 's' : '' }}
            </p>

            <!-- Actions -->
            <div class="flex gap-2">
              <Button
                label="View"
                icon="pi pi-eye"
                @click="viewNewsletter(newsletter)"
                class="flex-1"
              />
              <Button
                label="Download"
                icon="pi pi-download"
                @click="downloadNewsletter(newsletter)"
                severity="secondary"
                class="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF Viewer Dialog -->
    <Dialog
      v-model:visible="pdfViewerVisible"
      :header="selectedNewsletter?.title"
      :style="{ width: '90vw', maxWidth: '1200px' }"
      :modal="true"
      :closable="true"
    >
      <div v-if="selectedNewsletter && selectedNewsletter.pdfUrl" class="pdf-viewer-container">
        <iframe
          :src="selectedNewsletter.pdfUrl"
          class="w-full"
          style="height: 80vh; border: none"
          title="PDF Viewer"
        ></iframe>
        <div class="mt-4 flex justify-end gap-2">
          <Button
            label="Download"
            icon="pi pi-download"
            @click="downloadNewsletter(selectedNewsletter)"
          />
          <Button label="Print" icon="pi pi-print" @click="printNewsletter" severity="secondary" />
        </div>
      </div>
    </Dialog>

    <!-- Card Image Viewer Dialog -->
    <Dialog
      v-model:visible="cardViewerVisible"
      :header="`${selectedNewsletter?.title} - ${cardViewMode === 'front' ? 'Card Front' : 'Card Back'}`"
      :style="{ width: '90vw', maxWidth: '800px' }"
      :modal="true"
      :closable="true"
    >
      <div v-if="selectedCardImageUrl" class="card-viewer-container">
        <img
          :src="selectedCardImageUrl"
          :alt="`${selectedNewsletter?.title} card`"
          class="w-full h-auto max-h-[80vh] object-contain"
        />
        <div class="mt-4 flex justify-between items-center">
          <Button
            v-if="selectedNewsletter?.cardBackImageUrl && cardViewMode === 'front'"
            label="View Back"
            icon="pi pi-arrow-right"
            @click="viewCardImage(selectedNewsletter, 'back')"
          />
          <div v-else></div>
          <div class="flex gap-2">
            <Button label="Download" icon="pi pi-download" @click="downloadCardImage" />
            <Button
              v-if="selectedNewsletter?.cardBackImageUrl && cardViewMode === 'back'"
              label="View Front"
              icon="pi pi-arrow-left"
              @click="viewCardImage(selectedNewsletter, 'front')"
              severity="secondary"
            />
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { generateClient } from 'aws-amplify/api'
import { getUrl } from 'aws-amplify/storage'
import { getCurrentUser } from 'aws-amplify/auth'
import { useRouter } from 'vue-router'
import type { Schema } from '@amplify/data/resource'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const client = generateClient<Schema>()
const router = useRouter()

interface Newsletter {
  id?: string
  title: string
  year: number
  hasCardImage?: boolean
  cardImageUrl?: string
  cardBackImageUrl?: string
  pdfThumbnailUrl?: string
  pdfUrl?: string
  pdfPageCount?: number
}

const newsletters = ref<Newsletter[]>([])
const loading = ref(true)
const error = ref('')
const isAuthenticated = ref(false)

const pdfViewerVisible = ref(false)
const selectedNewsletter = ref<Newsletter | null>(null)

const cardViewerVisible = ref(false)
const selectedCardImageUrl = ref('')
const cardViewMode = ref<'front' | 'back'>('front')

const sortedNewsletters = computed(() => {
  return [...newsletters.value].sort((a, b) => b.year - a.year)
})

onMounted(async () => {
  // Authentication is now handled by router guard
  // Just fetch newsletters if we get here (user is authenticated)
  try {
    await getCurrentUser()
    isAuthenticated.value = true
    await fetchNewsletters()
  } catch {
    // This shouldn't happen due to router guard, but handle gracefully
    isAuthenticated.value = false
    router.push('/login')
  }
})

async function fetchNewsletters() {
  loading.value = true
  error.value = ''

  try {
    const result = await client.models.Newsletter.list()

    if (result.data) {
      newsletters.value = result.data.map((n) => ({
        id: n.id,
        title: n.title,
        year: n.year,
        hasCardImage: n.hasCardImage ?? undefined,
        pdfPageCount: n.pdfPageCount ?? undefined,
      }))

      // Load URLs for each newsletter
      for (const newsletter of newsletters.value) {
        if (newsletter.id) {
          await loadNewsletterUrls(newsletter)
        }
      }
    }
  } catch (err: unknown) {
    console.error('Error fetching newsletters:', err)
    error.value = 'Unable to load newsletters. Please try again later.'
  } finally {
    loading.value = false
  }
}

async function loadNewsletterUrls(newsletter: Newsletter) {
  if (!newsletter.id) return

  const id = newsletter.id

  try {
    // Load PDF thumbnail
    try {
      const thumbnailUrl = await getFileUrl(id, 'newsletter-thumbnail')
      if (thumbnailUrl) {
        newsletter.pdfThumbnailUrl = thumbnailUrl
      }
    } catch {
      // Thumbnail not found, that's okay
    }

    // Load card images
    if (newsletter.hasCardImage) {
      try {
        const cardUrl = await getFileUrl(id, 'card')
        if (cardUrl) {
          newsletter.cardImageUrl = cardUrl
        }
      } catch {
        // Card image not found
      }

      try {
        const cardBackUrl = await getFileUrl(id, 'card-back')
        if (cardBackUrl) {
          newsletter.cardBackImageUrl = cardBackUrl
        }
      } catch {
        // Card back not found, that's okay
      }
    }
  } catch (err) {
    console.error('Error loading newsletter URLs:', err)
  }
}

async function getFileUrl(
  newsletterId: string,
  fileType: 'newsletter' | 'newsletter-thumbnail' | 'card' | 'card-back' | 'card-thumbnail',
): Promise<string | undefined> {
  try {
    const fileKey = getFileKey(newsletterId, fileType)
    const result = await getUrl({
      path: fileKey,
      options: {
        expiresIn: 3600, // 1 hour
      },
    })
    return result.url.toString()
  } catch (err: unknown) {
    console.error(`Error getting ${fileType} URL:`, err)
    return undefined
  }
}

function getFileKey(newsletterId: string, fileType: string): string {
  return `newsletters/${newsletterId}-${fileType}`
}

function handleThumbnailError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

function viewNewsletter(newsletter: Newsletter) {
  if (!newsletter.id) return

  // Load PDF URL if not already loaded
  if (!newsletter.pdfUrl) {
    getFileUrl(newsletter.id, 'newsletter').then((url) => {
      if (url) {
        newsletter.pdfUrl = url
        selectedNewsletter.value = newsletter
        pdfViewerVisible.value = true
      }
    })
  } else {
    selectedNewsletter.value = newsletter
    pdfViewerVisible.value = true
  }
}

async function downloadNewsletter(newsletter: Newsletter) {
  if (!newsletter.id) return

  try {
    let pdfUrl = newsletter.pdfUrl

    // Get PDF URL if not already loaded
    if (!pdfUrl) {
      pdfUrl = await getFileUrl(newsletter.id, 'newsletter')
      if (pdfUrl) {
        newsletter.pdfUrl = pdfUrl
      }
    }

    if (pdfUrl) {
      // Create download link
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${newsletter.title.replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (err) {
    console.error('Error downloading newsletter:', err)
    error.value = 'Unable to download newsletter. Please try again.'
  }
}

function printNewsletter() {
  if (selectedNewsletter.value?.pdfUrl) {
    window.open(selectedNewsletter.value.pdfUrl, '_blank')?.print()
  }
}

function viewCardImage(newsletter: Newsletter, side: 'front' | 'back') {
  selectedNewsletter.value = newsletter
  cardViewMode.value = side
  selectedCardImageUrl.value =
    side === 'front' ? newsletter.cardImageUrl || '' : newsletter.cardBackImageUrl || ''
  cardViewerVisible.value = true
}

async function downloadCardImage() {
  if (!selectedCardImageUrl.value) return

  try {
    const link = document.createElement('a')
    link.href = selectedCardImageUrl.value
    link.download = `${selectedNewsletter.value?.title.replace(/\s+/g, '-')}-card-${cardViewMode.value}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error downloading card image:', err)
    error.value = 'Unable to download card image. Please try again.'
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: var(--surface-ground);
}

.newsletter-card {
  transition: transform 0.2s;
}

.newsletter-card:hover {
  transform: translateY(-2px);
}

.pdf-viewer-container {
  width: 100%;
}

.card-viewer-container {
  text-align: center;
}
</style>
