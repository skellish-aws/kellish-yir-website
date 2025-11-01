<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl">Recipient Management</h2>
      <div class="flex gap-3">
        <Button
          label="Import CSV"
          icon="pi pi-upload"
          class="p-button-outlined"
          @click="showImportDialog = true"
        />
        <Button label="Add Recipient" icon="pi pi-plus" @click="showAddDialog" />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-blue-600">{{ totalRecipients }}</div>
        <div class="text-sm text-blue-600">Total Recipients</div>
      </div>
      <div class="bg-green-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-green-600">{{ codesUsed }}</div>
        <div class="text-sm text-green-600">Codes Used</div>
      </div>
      <div class="bg-yellow-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-yellow-600">{{ codesUnused }}</div>
        <div class="text-sm text-yellow-600">Codes Unused</div>
      </div>
      <div class="bg-purple-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-purple-600">{{ sendCards }}</div>
        <div class="text-sm text-purple-600">Send Cards</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-4">
      <div class="flex gap-4">
        <div class="flex-1 relative">
          <InputText
            v-model="searchTerm"
            placeholder="Search recipients..."
            class="w-full pr-10"
            @input="filterRecipients"
          />
          <button
            v-if="searchTerm"
            @click="clearSearch"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
        <Dropdown
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Filter by status"
          class="w-48"
          @change="filterRecipients"
        />
      </div>
      <div class="text-xs text-gray-500 mt-1 ml-1">
        Searches: Name, Email, City, State, Access Code
      </div>
    </div>

    <!-- Recipients List -->
    <div v-if="loading" class="flex justify-center">
      <ProgressSpinner />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <!-- Header Row -->
      <div class="bg-gray-100 px-4 py-3 border-b font-semibold text-sm text-gray-700">
        <div class="grid grid-cols-12 gap-4 items-center">
          <div class="col-span-1">
            <input
              type="checkbox"
              :checked="
                selectedRecipients.length === filteredRecipients.length &&
                filteredRecipients.length > 0
              "
              @change="toggleAllRecipients"
              class="w-4 h-4"
            />
          </div>
          <div class="col-span-3 cursor-pointer hover:text-blue-600" @click="sortBy('name')">
            Name
            <i
              v-if="sortField === 'name'"
              :class="sortDirection === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down'"
              class="ml-1 text-xs"
            ></i>
          </div>
          <div class="col-span-2 cursor-pointer hover:text-blue-600" @click="sortBy('city')">
            Address
            <i
              v-if="sortField === 'city'"
              :class="sortDirection === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down'"
              class="ml-1 text-xs"
            ></i>
          </div>
          <div class="col-span-2 cursor-pointer hover:text-blue-600" @click="sortBy('accessCode')">
            Access Code
            <i
              v-if="sortField === 'accessCode'"
              :class="sortDirection === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down'"
              class="ml-1 text-xs"
            ></i>
          </div>
          <div class="col-span-2 cursor-pointer hover:text-blue-600" @click="sortBy('status')">
            Status
            <i
              v-if="sortField === 'status'"
              :class="sortDirection === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down'"
              class="ml-1 text-xs"
            ></i>
          </div>
          <div class="col-span-2">Actions</div>
        </div>
      </div>

      <!-- Recipients List with fixed height and scroll -->
      <div class="divide-y max-h-[calc(100vh-500px)] overflow-y-auto">
        <div
          v-for="recipient in filteredRecipients"
          :key="recipient.id"
          class="px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div class="grid grid-cols-12 gap-4 items-center">
            <!-- Checkbox -->
            <div class="col-span-1">
              <input
                type="checkbox"
                :value="recipient.id"
                v-model="selectedRecipients"
                class="w-4 h-4"
              />
            </div>

            <!-- Name -->
            <div class="col-span-3">
              <div class="font-medium">
                {{
                  recipient.mailingName ||
                  `${recipient.firstName} ${recipient.lastName}${recipient.suffix ? ', ' + recipient.suffix : ''}`
                }}
              </div>
              <div v-if="recipient.mailingName" class="text-xs text-gray-400">
                {{ recipient.firstName }} {{ recipient.lastName }}
              </div>
              <div v-else class="text-sm text-gray-500">{{ recipient.title }}</div>
            </div>

            <!-- Address -->
            <div class="col-span-2">
              <div class="flex items-start gap-2">
                <div class="flex-1">
                  <div v-if="recipient.address1" class="text-sm">{{ recipient.address1 }}</div>
                  <div v-if="recipient.address2" class="text-sm text-gray-600">
                    {{ recipient.address2 }}
                  </div>
                  <div
                    v-if="recipient.city || recipient.state || recipient.zipcode"
                    class="text-sm text-gray-500"
                  >
                    {{
                      [recipient.city, recipient.state, recipient.zipcode]
                        .filter(Boolean)
                        .join(', ')
                    }}
                  </div>
                  <div
                    v-if="!recipient.address1 && !recipient.city"
                    class="text-sm text-gray-400 italic"
                  >
                    No address
                  </div>
                </div>

                <!-- Validation Status Icon -->
                <div v-if="recipient.address1" class="flex-shrink-0 mt-0.5">
                  <i
                    v-if="recipient.addressValidationStatus === 'valid'"
                    class="pi pi-check-circle text-green-600 text-sm"
                    :title="recipient.addressValidationMessage || 'Address verified'"
                  ></i>
                  <i
                    v-else-if="recipient.addressValidationStatus === 'invalid'"
                    class="pi pi-exclamation-triangle text-yellow-600 text-sm"
                    :title="recipient.addressValidationMessage || 'Address could not be validated'"
                  ></i>
                  <i
                    v-else-if="recipient.addressValidationStatus === 'error'"
                    class="pi pi-times-circle text-red-600 text-sm"
                    :title="recipient.addressValidationMessage || 'Validation failed'"
                  ></i>
                  <i
                    v-else-if="recipient.addressValidationStatus === 'queued'"
                    class="pi pi-clock text-blue-600 text-sm animate-pulse"
                    title="Validation in progress..."
                  ></i>
                  <i
                    v-else
                    class="pi pi-question-circle text-gray-400 text-sm"
                    title="Not yet validated"
                  ></i>
                </div>
              </div>
            </div>

            <!-- Access Code -->
            <div class="col-span-2">
              <div
                v-if="recipient.accessCode"
                class="font-mono text-sm bg-gray-100 px-2 py-1 rounded"
              >
                {{ recipient.accessCode }}
              </div>
              <div v-else class="text-gray-400 text-sm">No code</div>
            </div>

            <!-- Status -->
            <div class="col-span-2">
              <div class="flex flex-col gap-1">
                <span
                  :class="{
                    'text-green-600': recipient.accessCodeUsed,
                    'text-yellow-600': !recipient.accessCodeUsed && recipient.accessCode,
                    'text-gray-400': !recipient.accessCode,
                  }"
                  class="text-sm font-medium"
                >
                  {{
                    recipient.accessCodeUsed ? 'Used' : recipient.accessCode ? 'Unused' : 'No Code'
                  }}
                </span>
                <span
                  :class="{
                    'text-green-600': recipient.sendCard,
                    'text-red-600': !recipient.sendCard,
                  }"
                  class="text-xs"
                >
                  {{ recipient.sendCard ? 'Send Card' : 'No Card' }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="col-span-2">
              <div class="flex gap-2">
                <button
                  @click="editRecipient(recipient)"
                  class="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit recipient"
                >
                  <i class="pi pi-pencil text-sm"></i>
                </button>
                <button
                  @click="regenerateCode(recipient)"
                  class="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Regenerate code"
                >
                  <i class="pi pi-refresh text-sm"></i>
                </button>
                <button
                  @click="deleteRecipient(recipient)"
                  class="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Delete recipient"
                >
                  <i class="pi pi-trash text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedRecipients.length > 0" class="mt-4 flex gap-3">
      <Button
        :label="`Delete Selected (${selectedRecipients.length})`"
        icon="pi pi-trash"
        class="p-button-danger"
        @click="confirmBulkDelete"
      />
      <Button
        :label="`Generate Codes (${selectedRecipients.length})`"
        icon="pi pi-key"
        class="p-button-outlined"
        @click="generateCodesForSelected"
      />
    </div>

    <!-- Cleanup Actions -->
    <div class="mt-4 flex gap-3">
      <Button
        label="Remove Duplicates"
        icon="pi pi-filter"
        class="p-button-warning"
        @click="removeDuplicates"
      />
    </div>

    <!-- Add/Edit Recipient Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="isEditing ? 'Edit Recipient' : 'Add Recipient'"
      modal
      :style="{ width: '900px' }"
      @hide="resetDialog"
    >
      <div class="space-y-4">
        <!-- Warning banner for international addresses if Geoapify not configured -->
        <div
          v-if="!geoapifyValidator.isEnabled() && form.country && !isUSCountry(form.country)"
          class="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2"
        >
          <i class="pi pi-exclamation-triangle text-yellow-600 mt-0.5"></i>
          <div class="text-sm text-yellow-800">
            <strong>International address validation not configured.</strong>
            Address will be saved without validation. To enable validation, set up Geoapify API key.
          </div>
        </div>

        <div class="grid grid-cols-11 gap-3">
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-1">Title</label>
            <AutoComplete
              v-model="form.title"
              :suggestions="filteredTitles"
              @complete="searchTitle"
              @change="updateMailingName"
              placeholder="Type or click..."
              class="w-full"
              dropdown
            />
          </div>
          <div class="col-span-3">
            <label class="block text-sm font-medium mb-1">First Name *</label>
            <InputText
              v-model="form.firstName"
              class="w-full"
              required
              @input="updateMailingName"
            />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-1">Second Name</label>
            <InputText v-model="form.secondName" class="w-full" @input="updateMailingName" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-1">Last Name *</label>
            <InputText v-model="form.lastName" class="w-full" required @input="updateMailingName" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-1">Suffix</label>
            <AutoComplete
              v-model="form.suffix"
              :suggestions="filteredSuffixes"
              @complete="searchSuffix"
              @change="updateMailingName"
              placeholder="Type..."
              class="w-full"
              dropdown
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">
            Mailing Name
            <span class="text-xs text-gray-500 font-normal ml-2"
              >(How it appears on envelope/label)</span
            >
          </label>
          <InputText
            v-model="form.mailingName"
            class="w-full"
            placeholder="Leave blank to auto-generate, or customize for couples/families/businesses"
            @input="onMailingNameInput"
          />
          <div
            v-if="suggestedMailingName && !mailingNameManuallyEdited"
            class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1 inline-block"
          >
            💡 Auto-generating: {{ suggestedMailingName }}
          </div>
          <div v-if="mailingNameManuallyEdited" class="text-xs text-gray-500 mt-1">
            Custom mailing name (auto-generation disabled)
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <InputText
              v-model="form.email"
              type="email"
              class="w-full"
              placeholder="alec@example.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">
              Country
              <span class="text-xs text-gray-500 font-normal ml-2">
                (for address suggestions)
              </span>
            </label>
            <InputText
              v-model="form.country"
              class="w-full"
              placeholder="USA, Spain, United Kingdom, etc."
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">
              Address 1
              <span v-if="addressSuggestions.length > 0" class="text-xs text-blue-600 ml-2">
                ({{ addressSuggestions.length }} suggestions)
              </span>
            </label>
            <AutoComplete
              v-model="form.address1"
              :suggestions="addressSuggestions"
              @complete="searchAddress"
              @item-select="onAddressSelect"
              @change="onAddressChange"
              :placeholder="
                geoapifyAutocomplete.isEnabled()
                  ? 'Start typing address...'
                  : 'Enter address (autocomplete not configured)'
              "
              :showEmptyMessage="false"
              :minLength="3"
              class="w-full"
              optionLabel="formatted"
            >
              <template #option="slotProps">
                <div>{{ slotProps.option.formatted }}</div>
              </template>
            </AutoComplete>
            <div v-if="!geoapifyAutocomplete.isEnabled()" class="text-xs text-orange-600 mt-1">
              💡 Tip: Set VITE_GEOAPIFY_API_KEY for address autocomplete
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Address 2</label>
            <InputText v-model="form.address2" @focus="clearAddressSuggestions" class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-1">City</label>
            <InputText v-model="form.city" @focus="clearAddressSuggestions" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">State/Province</label>
            <InputText v-model="form.state" class="w-full" placeholder="PA, Ontario, etc." />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">ZIP/Postal Code</label>
            <InputText v-model="form.zipcode" class="w-full" placeholder="19147, M5H 2N2" />
          </div>
        </div>

        <div class="flex gap-4">
          <div class="flex items-center">
            <Checkbox v-model="form.sendCard" :binary="true" inputId="sendCard" />
            <label for="sendCard" class="ml-2 text-sm">Send Card</label>
          </div>
          <div class="flex items-center">
            <Checkbox v-model="form.wantsPaper" :binary="true" inputId="wantsPaper" />
            <label for="wantsPaper" class="ml-2 text-sm">Wants Paper</label>
          </div>
        </div>

        <div v-if="form.accessCode" class="bg-gray-50 p-3 rounded">
          <label class="block text-sm font-medium mb-1">Access Code</label>
          <div class="font-mono text-sm">{{ form.accessCode }}</div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" class="p-button-text" @click="resetDialog" />
        <Button
          :label="isEditing ? 'Update' : 'Create'"
          icon="pi pi-check"
          @click="saveRecipient"
          :loading="saving"
        />
      </template>
    </Dialog>

    <!-- Import Dialog -->
    <Dialog
      v-model:visible="showImportDialog"
      header="Import Recipients from Excel/CSV"
      modal
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Upload an Excel (.xlsx/.xlsm) or CSV file with recipient data. The file should have
          columns for: Title, First Name, Last Name, Address, City, State, ZIP, Send Card.
          <br /><br />
          <strong>Note:</strong> Your existing "Yearly Christmas Card List.xlsm" file is fully
          supported!
        </p>

        <FileUpload
          mode="basic"
          name="excelFile"
          accept=".csv,.xlsx,.xlsm"
          :auto="false"
          chooseLabel="Choose Excel/CSV File"
          @select="onFileSelect"
          :maxFileSize="10000000"
        />

        <div v-if="importPreview.length > 0" class="max-h-60 overflow-y-auto">
          <h4 class="font-medium mb-2">Preview ({{ importPreview.length }} recipients):</h4>
          <div class="space-y-1">
            <div
              v-for="(recipient, index) in importPreview.slice(0, 10)"
              :key="index"
              class="text-sm p-2 bg-gray-50 rounded"
            >
              {{ recipient.firstName }} {{ recipient.lastName }} - {{ recipient.city }},
              {{ recipient.state }}
            </div>
            <div v-if="importPreview.length > 10" class="text-sm text-gray-500">
              ... and {{ importPreview.length - 10 }} more
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" @click="cancelImport" />
        <Button
          label="Import Recipients"
          icon="pi pi-upload"
          @click="importRecipients"
          :disabled="importPreview.length === 0"
          :loading="importing"
        />
      </template>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog v-model:visible="deleteDialogVisible" header="Confirm Delete" modal>
      <span>Are you sure you want to delete {{ selectedRecipients.length }} recipient(s)?</span>
      <template #footer>
        <Button label="Cancel" @click="deleteDialogVisible = false" />
        <Button label="Delete" class="p-button-danger" @click="deleteSelectedRecipients" />
      </template>
    </Dialog>

    <!-- Address Validation Confirmation -->
    <Dialog
      v-model:visible="showAddressConfirmDialog"
      header="Address Validation"
      modal
      :style="{ width: '700px' }"
    >
      <div class="space-y-4">
        <p class="text-gray-700">
          {{ isInternationalValidation ? 'Geoapify' : 'USPS' }} returned a standardized version of
          this address. Which would you like to use?
        </p>

        <div class="grid grid-cols-2 gap-4">
          <!-- Original Address -->
          <div class="border rounded p-3 bg-gray-50">
            <h4 class="font-semibold text-sm text-gray-600 mb-2">Your Address:</h4>
            <div class="text-sm">
              <div>{{ originalAddress.address1 }}</div>
              <div v-if="originalAddress.address2">{{ originalAddress.address2 }}</div>
              <div>
                {{ originalAddress.city }}, {{ originalAddress.state }}
                {{ originalAddress.zipcode }}
              </div>
              <div v-if="originalAddress.country">{{ originalAddress.country }}</div>
            </div>
          </div>

          <!-- Validated Address -->
          <div class="border rounded p-3 bg-green-50 border-green-300">
            <h4 class="font-semibold text-sm text-green-700 mb-2">
              {{ isInternationalValidation ? 'Geoapify' : 'USPS' }} Validated:
              <span
                v-if="
                  isInternationalValidation &&
                  validatedAddressData &&
                  'confidence' in validatedAddressData
                "
                class="text-xs font-normal text-gray-600"
              >
                ({{ Math.round((validatedAddressData.confidence || 0) * 100) }}% confidence)
              </span>
            </h4>
            <div class="text-sm">
              <div>{{ validatedAddressData?.address1 }}</div>
              <div v-if="validatedAddressData?.address2">{{ validatedAddressData?.address2 }}</div>
              <div>
                {{ validatedAddressData?.city }}, {{ validatedAddressData?.state }}
                {{ validatedAddressData?.zipcode
                }}{{
                  !isInternationalValidation &&
                  validatedAddressData &&
                  'zipPlus4' in validatedAddressData &&
                  validatedAddressData?.zipPlus4
                    ? `-${validatedAddressData?.zipPlus4}`
                    : ''
                }}
              </div>
              <div
                v-if="
                  isInternationalValidation &&
                  validatedAddressData &&
                  'country' in validatedAddressData
                "
              >
                {{ validatedAddressData?.country }}
              </div>
            </div>
          </div>
        </div>

        <!-- Show Alternatives Button (only for Geoapify) -->
        <div
          v-if="isInternationalValidation && alternativeAddresses.length > 0"
          class="text-center"
        >
          <Button
            :label="showAlternatives ? 'Hide Alternatives' : 'Show Other Matches'"
            icon="pi pi-list"
            class="p-button-text p-button-sm"
            @click="showAlternatives = !showAlternatives"
          />
        </div>

        <!-- Alternative Addresses List -->
        <div v-if="showAlternatives && alternativeAddresses.length > 0" class="space-y-2">
          <h4 class="font-semibold text-sm text-gray-700">Other Possible Matches:</h4>
          <div
            v-for="(alt, index) in alternativeAddresses"
            :key="index"
            class="border rounded p-3 bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
            @click="useAlternativeAddress(alt)"
          >
            <div class="flex justify-between items-start">
              <div class="text-sm flex-1">
                <div>{{ alt.address1 }}</div>
                <div v-if="alt.address2">{{ alt.address2 }}</div>
                <div>{{ alt.city }}, {{ alt.state }} {{ alt.zipcode }}</div>
                <div v-if="alt.country">{{ alt.country }}</div>
              </div>
              <div class="text-xs text-gray-600 ml-2">
                {{ Math.round((alt.confidence || 0) * 100) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Use My Address" class="p-button-outlined" @click="useOriginalAddress" />
        <Button
          :label="`Use ${isInternationalValidation ? 'Geoapify' : 'USPS'} Address`"
          class="p-button-success"
          @click="useValidatedAddress"
        />
      </template>
    </Dialog>

    <!-- Address Validation Error Dialog -->
    <Dialog
      v-model:visible="showValidationErrorDialog"
      header="Address Validation Failed"
      modal
      :style="{ width: '600px' }"
    >
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-yellow-600 text-3xl"></i>
          <div class="flex-1">
            <p class="text-gray-700 mb-3">
              {{ isInternationalValidation ? 'Geoapify' : 'USPS' }} could not validate this address:
            </p>
            <div class="border rounded p-3 bg-gray-50 mb-3">
              <div class="text-sm">
                <div>{{ validationErrorAddress.address1 }}</div>
                <div v-if="validationErrorAddress.address2">
                  {{ validationErrorAddress.address2 }}
                </div>
                <div>
                  {{ validationErrorAddress.city }}, {{ validationErrorAddress.state }}
                  {{ validationErrorAddress.zipcode }}
                </div>
                <div v-if="validationErrorAddress.country">
                  {{ validationErrorAddress.country }}
                </div>
              </div>
            </div>
            <div class="bg-red-50 border border-red-200 rounded p-3 mb-3">
              <p class="text-sm text-red-800 font-medium mb-1">Error Details:</p>
              <p class="text-sm text-red-700">{{ cleanErrorMessage(validationErrorMessage) }}</p>
            </div>
            <p class="text-sm text-gray-600">
              This could mean the address doesn't exist, has a typo, or is too new to be in the
              {{ isInternationalValidation ? 'Geoapify' : 'USPS' }} database. You can save it as
              entered, or go back and correct it.
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Go Back and Edit"
          icon="pi pi-pencil"
          class="p-button-text"
          @click="cancelValidationError"
        />
        <Button
          label="Save Address As Entered"
          icon="pi pi-check"
          class="p-button-warning"
          @click="saveAddressDespiteError"
          autofocus
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'
import AutoComplete from 'primevue/autocomplete'

import type { Schema } from '@amplify/data/resource'
import { generateClient } from 'aws-amplify/api'
import { generateAccessCode } from '../utils/access-codes.ts'
import { uspsValidator, type USPSAddress, type USPSValidatedAddress } from '../utils/usps-api.ts'
import {
  geoapifyValidator,
  type GeoapifyAddress,
  type GeoapifyValidatedAddress,
} from '../utils/geoapify-validator.ts'
import { geoapifyAutocomplete, type AddressSuggestion } from '../utils/geoapify-autocomplete.ts'
import {
  addresszenValidator,
  type AddressZenAddress,
  type AddressZenValidatedAddress,
} from '../utils/addresszen-validator.ts'
import * as XLSX from 'xlsx'

// Types
interface Recipient {
  id?: string
  title?: string
  firstName: string
  secondName?: string
  lastName: string
  suffix?: string
  mailingName?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
  email?: string
  sendCard: boolean
  wantsPaper: boolean
  accessCode?: string
  accessCodeUsed: boolean
  accessCodeUsedAt?: string
  // Address validation fields
  addressValidationStatus?: string // 'pending', 'queued', 'valid', 'invalid', 'error'
  addressValidationMessage?: string
  addressValidatedAt?: string
  validatedAddress1?: string
  validatedAddress2?: string
  validatedCity?: string
  validatedState?: string
  validatedZipcode?: string
  validatedCountry?: string
  createdAt: string
  updatedAt: string
}

// State
const client = generateClient<Schema>()
const recipients = ref<Recipient[]>([])
const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const showImportDialog = ref(false)
const isEditing = ref(false)
const selectedRecipients = ref<string[]>([])
const searchTerm = ref('')
const statusFilter = ref('all')
const importPreview = ref<Recipient[]>([])
const sortField = ref<string>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Address validation state
const showAddressConfirmDialog = ref(false)
const showValidationErrorDialog = ref(false)
const originalAddress = ref<Partial<Recipient>>({})
const validatedAddressData = ref<
  USPSValidatedAddress | GeoapifyValidatedAddress | AddressZenValidatedAddress | null
>(null)
const alternativeAddresses = ref<GeoapifyValidatedAddress[]>([]) // Store alternative matches for Geoapify
const showAlternatives = ref(false) // Toggle to show/hide alternatives
const skipValidation = ref(false) // Flag to skip validation after user confirms
const isInternationalValidation = ref(false) // Track if using Geoapify for international
const validationErrorMessage = ref('')
const validationErrorAddress = ref<Partial<Recipient>>({})

// Mailing name auto-generation
const mailingNameManuallyEdited = ref(false)
const suggestedMailingName = ref('')

// Address autocomplete
const addressSuggestions = ref<AddressSuggestion[]>([])
let autocompleteAbortController: AbortController | null = null

// Form data
const form = ref<Partial<Recipient>>({
  title: '',
  firstName: '',
  secondName: '',
  lastName: '',
  suffix: '',
  mailingName: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zipcode: '',
  country: '',
  email: '',
  sendCard: true,
  wantsPaper: true,
})

// Status options for filter
const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Codes Used', value: 'used' },
  { label: 'Codes Unused', value: 'unused' },
  { label: 'No Codes', value: 'nocode' },
  { label: 'Send Cards', value: 'sendcard' },
  { label: 'No Cards', value: 'nocard' },
]

// Title and suffix options for autocomplete
const titleOptions = ref(['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Mr. and Mrs.', 'Drs.', 'Rev.', 'Prof.'])
const suffixOptions = ref(['Jr', 'Sr', 'II', 'III', 'IV', 'Esq.', 'PhD', 'MD'])
const filteredTitles = ref<string[]>(titleOptions.value)
const filteredSuffixes = ref<string[]>(suffixOptions.value)

// Computed properties
const totalRecipients = computed(() => recipients.value.length)
const codesUsed = computed(() => recipients.value.filter((r) => r.accessCodeUsed).length)
const codesUnused = computed(
  () => recipients.value.filter((r) => r.accessCode && !r.accessCodeUsed).length,
)
const sendCards = computed(() => recipients.value.filter((r) => r.sendCard).length)

const filteredRecipients = computed(() => {
  let filtered = recipients.value

  // Search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.firstName.toLowerCase().includes(term) ||
        r.lastName.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.city?.toLowerCase().includes(term) ||
        r.state?.toLowerCase().includes(term) ||
        r.accessCode?.toLowerCase().includes(term),
    )
  }

  // Status filter
  switch (statusFilter.value) {
    case 'used':
      filtered = filtered.filter((r) => r.accessCodeUsed)
      break
    case 'unused':
      filtered = filtered.filter((r) => r.accessCode && !r.accessCodeUsed)
      break
    case 'nocode':
      filtered = filtered.filter((r) => !r.accessCode)
      break
    case 'sendcard':
      filtered = filtered.filter((r) => r.sendCard)
      break
    case 'nocard':
      filtered = filtered.filter((r) => !r.sendCard)
      break
  }

  // Sort
  filtered.sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortField.value) {
      case 'name':
        aValue = (a.mailingName || `${a.firstName} ${a.lastName}`).toLowerCase()
        bValue = (b.mailingName || `${b.firstName} ${b.lastName}`).toLowerCase()
        break
      case 'city':
        aValue = (a.city || '').toLowerCase()
        bValue = (b.city || '').toLowerCase()
        break
      case 'accessCode':
        aValue = (a.accessCode || '').toLowerCase()
        bValue = (b.accessCode || '').toLowerCase()
        break
      case 'status':
        // Sort by: Used > Unused > No Code
        aValue = a.accessCodeUsed ? 0 : a.accessCode ? 1 : 2
        bValue = b.accessCodeUsed ? 0 : b.accessCode ? 1 : 2
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return filtered
})

// Methods
async function fetchRecipients(silentUpdate = false) {
  if (!silentUpdate) {
    loading.value = true
  }
  try {
    if (!silentUpdate) {
      console.log('Fetching recipients...')
    }

    // Fetch all recipients with pagination
    let allRecipients: Recipient[] = []
    let nextToken: string | null | undefined = undefined

    do {
      const {
        data,
        errors,
        nextToken: token,
      } = await client.models.Recipient.list({
        limit: 1000,
        nextToken: nextToken,
      })

      if (errors) {
        console.error('Errors fetching recipients:', errors)
        break
      }

      if (data) {
        allRecipients = [...allRecipients, ...(data as Recipient[])]
      }

      nextToken = token as string | null | undefined
    } while (nextToken)

    if (!silentUpdate) {
      console.log('Fetched recipients:', allRecipients.length)
      recipients.value = allRecipients
      console.log('Recipients list updated, count:', recipients.value.length)
    } else {
      // Silent update: only update validation status fields to avoid flickering
      allRecipients.forEach((fetchedRecipient) => {
        const existingIndex = recipients.value.findIndex((r) => r.id === fetchedRecipient.id)
        if (existingIndex !== -1) {
          const existing = recipients.value[existingIndex]
          // Only update if validation status changed
          if (
            existing.addressValidationStatus !== fetchedRecipient.addressValidationStatus ||
            existing.addressValidationMessage !== fetchedRecipient.addressValidationMessage
          ) {
            existing.addressValidationStatus = fetchedRecipient.addressValidationStatus
            existing.addressValidationMessage = fetchedRecipient.addressValidationMessage
            existing.addressValidatedAt = fetchedRecipient.addressValidatedAt
          }
        } else {
          // New recipient, add it
          recipients.value.push(fetchedRecipient)
        }
      })
    }
  } catch (err) {
    console.error('Error loading recipients:', err)
  } finally {
    if (!silentUpdate) {
      loading.value = false
    }
  }
}

function showAddDialog() {
  isEditing.value = false
  mailingNameManuallyEdited.value = false
  form.value = {
    title: '',
    firstName: '',
    secondName: '',
    lastName: '',
    suffix: '',
    mailingName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    email: '',
    sendCard: true,
    wantsPaper: true,
  }
  dialogVisible.value = true

  // Fix tab order after dialog opens
  setTimeout(() => {
    const dropdownButtons = document.querySelectorAll('.p-autocomplete-dropdown')
    dropdownButtons.forEach((button) => {
      button.setAttribute('tabindex', '-1')
    })
  }, 200)
}

function editRecipient(recipient: Recipient) {
  isEditing.value = true
  form.value = { ...recipient }
  dialogVisible.value = true

  // Fix tab order after dialog opens
  setTimeout(() => {
    const dropdownButtons = document.querySelectorAll('.p-autocomplete-dropdown')
    dropdownButtons.forEach((button) => {
      button.setAttribute('tabindex', '-1')
    })
  }, 200)
}

async function saveRecipient() {
  try {
    saving.value = true

    // Validate required fields - need at least first name or last name (for businesses)
    if (!form.value.firstName?.trim() && !form.value.lastName?.trim()) {
      alert('Either first name or last name is required')
      saving.value = false
      return
    }

    // Auto-validate address if address fields are provided (unless we're skipping validation)
    // For US addresses, state and city are required. For international, address1 and country are sufficient.
    const country = form.value.country?.trim().toLowerCase() || ''
    const isUSAddress =
      !country || country === 'usa' || country === 'united states' || country === 'us'
    const hasMinimumAddressInfo =
      form.value.address1?.trim() &&
      (isUSAddress
        ? form.value.city?.trim() && form.value.state?.trim() // US: need city and state
        : form.value.country?.trim()) // International: just need country

    if (!skipValidation.value && hasMinimumAddressInfo) {
      console.log('📍 Starting address validation...', {
        address1: form.value.address1,
        city: form.value.city,
        state: form.value.state,
        country: form.value.country,
        zipcode: form.value.zipcode,
      })
      const validationResult = await validateAddressBeforeSave()
      console.log('📍 Validation result:', validationResult)

      // If validation returned false, it means user needs to confirm or validation failed
      if (validationResult === false) {
        saving.value = false
        return
      }
      // If validation returned true or null, continue with save
    } else {
      console.log('⚠️ Skipping validation:', {
        skipValidation: skipValidation.value,
        hasMinimumAddressInfo,
      })
    }

    // Reset skip flag for next save
    skipValidation.value = false

    // Basic address validation
    const validationErrors = []

    // Note: country and isUSAddress already declared above for validation check

    // ZIP code validation (only for US addresses)
    if (form.value.zipcode?.trim() && isUSAddress) {
      const zipCode = form.value.zipcode.trim()
      const zipRegex = /^\d{5}(-\d{4})?$/
      if (!zipRegex.test(zipCode)) {
        validationErrors.push('ZIP code must be in format 12345 or 12345-6789')
      }
    }

    if (form.value.state?.trim() && isUSAddress) {
      const state = form.value.state.trim()
      const validStates = [
        'AL',
        'AK',
        'AZ',
        'AR',
        'CA',
        'CO',
        'CT',
        'DE',
        'FL',
        'GA',
        'HI',
        'ID',
        'IL',
        'IN',
        'IA',
        'KS',
        'KY',
        'LA',
        'ME',
        'MD',
        'MA',
        'MI',
        'MN',
        'MS',
        'MO',
        'MT',
        'NE',
        'NV',
        'NH',
        'NJ',
        'NM',
        'NY',
        'NC',
        'ND',
        'OH',
        'OK',
        'OR',
        'PA',
        'RI',
        'SC',
        'SD',
        'TN',
        'TX',
        'UT',
        'VT',
        'VA',
        'WA',
        'WV',
        'WI',
        'WY',
        'DC',
        'AS',
        'GU',
        'MP',
        'PR',
        'VI',
      ]
      const fullStateNames = [
        'Alabama',
        'Alaska',
        'Arizona',
        'Arkansas',
        'California',
        'Colorado',
        'Connecticut',
        'Delaware',
        'Florida',
        'Georgia',
        'Hawaii',
        'Idaho',
        'Illinois',
        'Indiana',
        'Iowa',
        'Kansas',
        'Kentucky',
        'Louisiana',
        'Maine',
        'Maryland',
        'Massachusetts',
        'Michigan',
        'Minnesota',
        'Mississippi',
        'Missouri',
        'Montana',
        'Nebraska',
        'Nevada',
        'New Hampshire',
        'New Jersey',
        'New Mexico',
        'New York',
        'North Carolina',
        'North Dakota',
        'Ohio',
        'Oklahoma',
        'Oregon',
        'Pennsylvania',
        'Rhode Island',
        'South Carolina',
        'South Dakota',
        'Tennessee',
        'Texas',
        'Utah',
        'Vermont',
        'Virginia',
        'Washington',
        'West Virginia',
        'Wisconsin',
        'Wyoming',
        'District of Columbia',
        'American Samoa',
        'Guam',
        'Northern Mariana Islands',
        'Puerto Rico',
        'U.S. Virgin Islands',
      ]

      const stateUpper = state.toUpperCase()
      const stateLower = state.toLowerCase()

      if (
        !validStates.includes(stateUpper) &&
        !fullStateNames.some(
          (name) => name.toLowerCase() === stateLower || name.toLowerCase().includes(stateLower),
        )
      ) {
        validationErrors.push('Please enter a valid state (e.g., "PA" or "Pennsylvania")')
      }
    }

    // Email validation (if provided)
    if (form.value.email?.trim()) {
      const email = form.value.email.trim()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        validationErrors.push('Please enter a valid email address')
      }
    }

    // Show validation errors
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n\n' + validationErrors.join('\n'))
      saving.value = false
      return
    }

    // Check for duplicates (only for new recipients, not when editing)
    if (!isEditing.value) {
      const firstName = (form.value.firstName || '').trim().toLowerCase()
      const lastName = (form.value.lastName || '').trim().toLowerCase()
      const email = form.value.email?.trim().toLowerCase() || ''

      const duplicate = recipients.value.find((recipient) => {
        const existingFirstName = recipient.firstName?.toLowerCase() || ''
        const existingLastName = recipient.lastName?.toLowerCase() || ''
        const existingEmail = recipient.email?.toLowerCase() || ''

        // Check for exact name match
        const nameMatch = existingFirstName === firstName && existingLastName === lastName

        // If email is provided, also check email match
        if (email) {
          return nameMatch && existingEmail === email
        }

        // If no email, just check name match
        return nameMatch
      })

      if (duplicate) {
        alert(
          `A recipient with the name "${form.value.firstName} ${form.value.lastName}" already exists. Please use a different name or edit the existing recipient.`,
        )
        saving.value = false
        return
      }
    }

    // Email is optional in the schema, but let's make it required for now
    // if (!form.value.email?.trim()) {
    //   alert('Email is required')
    //   saving.value = false
    //   return
    // }

    const now = new Date().toISOString()
    const recipientData = {
      ...form.value,
      firstName: form.value.firstName!,
      lastName: form.value.lastName!,
      email: form.value.email?.trim() || null,
      updatedAt: now,
    }

    console.log('Form data being saved:', recipientData)

    if (isEditing.value && form.value.id) {
      // Only include fields that are allowed in UpdateRecipientInput
      const updateData = {
        id: form.value.id,
        title: recipientData.title || null,
        firstName: recipientData.firstName,
        secondName: recipientData.secondName || null,
        lastName: recipientData.lastName,
        suffix: recipientData.suffix || null,
        mailingName: recipientData.mailingName || null,
        address1: recipientData.address1 || null,
        address2: recipientData.address2 || null,
        city: recipientData.city || null,
        state: recipientData.state || null,
        zipcode: recipientData.zipcode || null,
        country: recipientData.country || null,
        email: recipientData.email || null,
        wantsPaper: recipientData.wantsPaper ?? true,
        addressValidationStatus: recipientData.addressValidationStatus || null,
        addressValidationMessage: recipientData.addressValidationMessage || null,
        addressValidatedAt: recipientData.addressValidatedAt || null,
      }

      console.log('Updating existing recipient with data:', updateData)
      const updateResult = await client.models.Recipient.update(updateData)
      console.log('Recipient update result:', updateResult)

      if (updateResult.errors && updateResult.errors.length > 0) {
        console.error('Recipient update errors:', updateResult.errors)
        console.error('First error details:', JSON.stringify(updateResult.errors[0], null, 2))
        const errorMessage =
          updateResult.errors[0].message ||
          updateResult.errors[0].errorType ||
          JSON.stringify(updateResult.errors[0])
        alert(`Error updating recipient: ${errorMessage}`)
      } else {
        console.log('Recipient updated successfully:', updateResult.data)
      }
    } else {
      // Generate access code for new recipients
      if (!recipientData.accessCode) {
        recipientData.accessCode = generateAccessCode()
      }

      // Only include fields that are allowed in CreateRecipientInput
      const createData = {
        title: recipientData.title || null,
        firstName: recipientData.firstName,
        secondName: recipientData.secondName || null,
        lastName: recipientData.lastName,
        suffix: recipientData.suffix || null,
        mailingName: recipientData.mailingName || null,
        address1: recipientData.address1 || null,
        address2: recipientData.address2 || null,
        city: recipientData.city || null,
        state: recipientData.state || null,
        zipcode: recipientData.zipcode || null,
        country: recipientData.country || null,
        email: recipientData.email || '',
        wantsPaper: recipientData.wantsPaper ?? true,
        addressValidationStatus: recipientData.addressValidationStatus || null,
        addressValidationMessage: recipientData.addressValidationMessage || null,
        addressValidatedAt: recipientData.addressValidatedAt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      console.log('Creating recipient with data:', createData)
      const result = await client.models.Recipient.create(createData)
      console.log('Recipient creation result:', result)

      if (result.errors && result.errors.length > 0) {
        console.error('Recipient creation errors:', result.errors)
        alert(`Error creating recipient: ${result.errors[0].message || 'Unknown error'}`)
        return
      }

      if (!result.data) {
        console.error('No data returned from recipient creation')
        alert('Error creating recipient: No data returned')
        return
      }

      console.log('Recipient created successfully:', result.data)

      // Now update with additional fields that aren't in CreateRecipientInput
      if (result.data && result.data.id) {
        const updateData = {
          id: result.data.id,
          sendCard: recipientData.sendCard ?? true,
          accessCode: recipientData.accessCode,
          accessCodeUsed: recipientData.accessCodeUsed ?? false,
          updatedAt: now,
        }

        console.log('Updating recipient with additional fields:', updateData)
        const updateResult = await client.models.Recipient.update(updateData)
        console.log('Recipient update result:', updateResult)

        if (updateResult.errors && updateResult.errors.length > 0) {
          console.error('Recipient update errors:', updateResult.errors)
          alert(`Error updating recipient: ${updateResult.errors[0].message || 'Unknown error'}`)
        } else {
          console.log('Recipient updated successfully:', updateResult.data)
        }
      }
    }

    await fetchRecipients()
    resetDialog()
  } catch (err) {
    console.error('Error saving recipient:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    alert(`Error saving recipient: ${errorMessage}`)
  } finally {
    saving.value = false
  }
}

async function deleteRecipient(recipient: Recipient) {
  if (!recipient.id) return

  if (!confirm(`Delete ${recipient.firstName} ${recipient.lastName}?`)) return

  try {
    await client.models.Recipient.delete({ id: recipient.id })
    await fetchRecipients()
  } catch (err) {
    console.error('Error deleting recipient:', err)
  }
}

async function regenerateCode(recipient: Recipient) {
  if (!recipient.id) return

  try {
    const newCode = generateAccessCode()
    await client.models.Recipient.update({
      id: recipient.id,
      accessCode: newCode,
      accessCodeUsed: false,
      accessCodeUsedAt: null,
      updatedAt: new Date().toISOString(),
    })
    await fetchRecipients()
  } catch (err) {
    console.error('Error regenerating code:', err)
  }
}

function resetDialog() {
  dialogVisible.value = false
  isEditing.value = false
  form.value = {
    title: '',
    firstName: '',
    secondName: '',
    lastName: '',
    suffix: '',
    mailingName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    email: '',
    sendCard: true,
    wantsPaper: true,
  }
  // Reset mailing name state
  mailingNameManuallyEdited.value = false
  suggestedMailingName.value = ''
  // Reset validation state
  skipValidation.value = false
  showAddressConfirmDialog.value = false
  showValidationErrorDialog.value = false
  // Reset autocomplete suggestions
  addressSuggestions.value = []
}

function toggleAllRecipients() {
  if (selectedRecipients.value.length === filteredRecipients.value.length) {
    selectedRecipients.value = []
  } else {
    selectedRecipients.value = filteredRecipients.value.map((r) => r.id).filter(Boolean) as string[]
  }
}

function filterRecipients() {
  // Triggered by search input and dropdown change
}

function clearSearch() {
  searchTerm.value = ''
}

function isUSCountry(country: string | undefined): boolean {
  if (!country) return true // Empty country defaults to US
  const normalized = country.trim().toLowerCase()
  return normalized === 'usa' || normalized === 'united states' || normalized === 'us'
}

function sortBy(field: string) {
  if (sortField.value === field) {
    // Toggle direction if same field
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // New field, default to ascending
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function confirmBulkDelete() {
  deleteDialogVisible.value = true
}

async function deleteSelectedRecipients() {
  try {
    // Delete all recipients in parallel for better performance
    await Promise.all(selectedRecipients.value.map((id) => client.models.Recipient.delete({ id })))
    await fetchRecipients()
    selectedRecipients.value = []
    deleteDialogVisible.value = false
  } catch (err) {
    console.error('Error deleting recipients:', err)
    alert('Error deleting recipients. Please try again.')
  }
}

async function generateCodesForSelected() {
  try {
    // Generate codes for all recipients in parallel for better performance
    await Promise.all(
      selectedRecipients.value.map((id) => {
        const newCode = generateAccessCode()
        return client.models.Recipient.update({
          id,
          accessCode: newCode,
          accessCodeUsed: false,
          accessCodeUsedAt: null,
          updatedAt: new Date().toISOString(),
        })
      }),
    )
    await fetchRecipients()
    selectedRecipients.value = []
  } catch (err) {
    console.error('Error generating codes:', err)
    alert('Error generating codes. Please try again.')
  }
}

function onFileSelect(event: { files: File[] }) {
  const file = event.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = e.target?.result

    if (file.name.endsWith('.csv')) {
      // Handle CSV files
      const csv = data as string
      parseCSV(csv)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm')) {
      // Handle Excel files
      const workbook = XLSX.read(data, { type: 'binary' })
      parseExcel(workbook)
    }
  }

  if (file.name.endsWith('.csv')) {
    reader.readAsText(file)
  } else {
    reader.readAsBinaryString(file)
  }
}

function parseExcel(workbook: XLSX.WorkBook) {
  // Get the first worksheet
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert to JSON with header mapping
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

  if (jsonData.length < 2) {
    console.error('Excel file appears to be empty or has no data rows')
    return
  }

  // Map the columns based on your Excel structure
  const preview: Recipient[] = []

  for (let i = 1; i < jsonData.length; i++) {
    // Process all rows
    const row = jsonData[i]
    if (!row || row.length < 14) {
      continue
    }

    // Column mapping based on actual structure: Skipprint | From Who | Title | First Name(s) | Second Name | (unused) | (unused) | Last Name | Address1 | Address2 | City | State | Zip | Country
    const title = row[2] || ''
    const firstName = row[3] || ''
    const secondName = row[4] || ''
    const lastName = row[7] || ''
    const address1 = row[8] || ''
    const address2 = row[9] || ''
    const city = row[10] || ''
    const state = row[11] || ''
    const zip = row[12] || ''
    const country = row[13] || ''

    // Only include entries with at least a first name or last name (businesses may only have last name)
    if (firstName || lastName) {
      const recipient: Recipient = {
        title: title || '',
        firstName: firstName,
        secondName: secondName || '',
        lastName: lastName,
        address1: address1 || '',
        address2: address2 || '',
        city: city || '',
        state: state || '',
        zipcode: zip || '',
        country: country || '',
        email: '', // No email in the Excel file
        sendCard: true,
        wantsPaper: true,
        accessCode: generateAccessCode(),
        accessCodeUsed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Auto-generate mailing name during import
      recipient.mailingName = generateMailingNameFromRecipient(recipient)

      preview.push(recipient)
    }
  }

  console.log(`📥 Imported ${preview.length} recipients from Excel`)
  importPreview.value = preview
}

function parseCSV(csv: string) {
  const lines = csv.split('\n')

  const preview: Recipient[] = []

  for (let i = 1; i < lines.length; i++) {
    // Process all rows
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''))

    if (values.length >= 3) {
      const recipient: Recipient = {
        title: values[0] || '',
        firstName: values[1] || '',
        secondName: values[2] || '',
        lastName: values[3] || '',
        address1: values[4] || '',
        address2: values[5] || '',
        city: values[6] || '',
        state: values[7] || '',
        zipcode: values[8] || '',
        email: values[9] || '',
        sendCard: values[10]?.toLowerCase() !== 'no',
        wantsPaper: true,
        accessCode: generateAccessCode(),
        accessCodeUsed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Auto-generate mailing name during import
      recipient.mailingName = generateMailingNameFromRecipient(recipient)

      preview.push(recipient)
    }
  }

  importPreview.value = preview
}

function cancelImport() {
  showImportDialog.value = false
  importPreview.value = []
}

async function importRecipients() {
  try {
    importing.value = true

    // Import all recipients in parallel for better performance
    // Process in batches of 25 to avoid overwhelming the API
    const batchSize = 25
    const createdRecipients: Array<{
      id: string
      address: {
        address1: string
        address2: string
        city: string
        state: string
        zipcode: string
        country: string
      }
    }> = []

    for (let i = 0; i < importPreview.value.length; i += batchSize) {
      const batch = importPreview.value.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map((recipient) => client.models.Recipient.create(recipient)),
      )

      // Collect created recipients that need validation
      results.forEach((result, index) => {
        if (result.data?.id) {
          const recipient = batch[index]

          // Only queue if address exists (city is optional for international addresses)
          if (recipient.address1) {
            createdRecipients.push({
              id: result.data.id,
              address: {
                address1: recipient.address1 || '',
                address2: recipient.address2 || '',
                city: recipient.city || '',
                state: recipient.state || '',
                zipcode: recipient.zipcode || '',
                country: recipient.country || '',
              },
            })
          }
        }
      })
    }

    // Queue validation requests for all imported recipients
    if (createdRecipients.length > 0) {
      console.log(`📮 Queueing ${createdRecipients.length} addresses for background validation...`)
      await queueValidationRequests(createdRecipients)

      // Start polling to watch for validation status updates
      setTimeout(() => startValidationPolling(), 2000)
    }

    await fetchRecipients()
    showImportDialog.value = false
    importPreview.value = []
  } catch (err) {
    console.error('❌ Error importing recipients:', err)
    alert('Error importing recipients. Please try again.')
  } finally {
    importing.value = false
  }
}

async function queueValidationRequests(
  recipients: Array<{
    id: string
    address: {
      address1: string
      address2: string
      city: string
      state: string
      zipcode: string
      country: string
    }
  }>,
): Promise<void> {
  // Read queue URL from Amplify outputs (auto-configured by backend)
  const outputs = (await import('../../amplify_outputs.json')).default
  const QUEUE_API_URL = outputs.custom?.queueValidationUrl

  if (!QUEUE_API_URL) {
    console.warn('⚠️ Queue validation URL not configured, skipping background validation')
    return
  }

  try {
    const requests = recipients.map((r) => ({
      recipientId: r.id,
      address1: r.address.address1,
      address2: r.address.address2,
      city: r.address.city,
      state: r.address.state,
      zipcode: r.address.zipcode,
      country: r.address.country,
    }))

    // Separate US and international addresses for rate limiting
    // USPS has 60 calls/hour limit, so we need to space them out
    const usAddresses = requests.filter((r) => {
      const country = (r.country || '').toLowerCase()
      return !country || country === 'usa' || country === 'united states' || country === 'us'
    })
    const internationalAddresses = requests.filter((r) => {
      const country = (r.country || '').toLowerCase()
      return country && country !== 'usa' && country !== 'united states' && country !== 'us'
    })

    // Send international addresses first (no rate limit)
    if (internationalAddresses.length > 0) {
      const batchSize = 50
      for (let i = 0; i < internationalAddresses.length; i += batchSize) {
        const batch = internationalAddresses.slice(i, i + batchSize)
        const response = await fetch(QUEUE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        })
        if (!response.ok) {
          const errorText = await response.text()
          console.error(
            `Failed to queue international batch ${i / batchSize + 1}: ${response.status}`,
            errorText,
          )
        }
      }
    }

    // For US addresses, send in batches
    // Note: The Lambda will handle rate limiting to respect the 60/hour USPS quota
    if (usAddresses.length > 0) {
      console.log(
        `📮 Queueing ${usAddresses.length} US addresses for background validation (will respect 60/hour USPS quota)...`,
      )
      // Warn user if there are many US addresses
      if (usAddresses.length > 50) {
        alert(
          `Note: You're importing ${usAddresses.length} US addresses. Due to USPS API quota limits (60 calls/hour), validation may take several hours. International addresses will be validated immediately.`,
        )
      }

      const batchSize = 50
      for (let i = 0; i < usAddresses.length; i += batchSize) {
        const batch = usAddresses.slice(i, i + batchSize)
        const response = await fetch(QUEUE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        })
        if (!response.ok) {
          const errorText = await response.text()
          console.error(
            `Failed to queue US batch ${i / batchSize + 1}: ${response.status}`,
            errorText,
          )
        }
      }
    }

    console.log(
      `✅ Queued ${recipients.length} addresses for validation (${usAddresses.length} US, ${internationalAddresses.length} international)`,
    )
  } catch (error) {
    console.error('Error queuing validation requests:', error)
  }
}

async function removeDuplicates() {
  if (!confirm('This will remove duplicate recipients based on name and email. Continue?')) {
    return
  }

  try {
    const duplicates = []
    const seen = new Set()

    for (const recipient of recipients.value) {
      const key = `${recipient.firstName?.toLowerCase()}-${recipient.lastName?.toLowerCase()}-${recipient.email?.toLowerCase() || ''}`

      if (seen.has(key)) {
        duplicates.push(recipient)
      } else {
        seen.add(key)
      }
    }

    if (duplicates.length === 0) {
      alert('No duplicates found!')
      return
    }

    // Delete duplicates
    for (const duplicate of duplicates) {
      if (duplicate.id) {
        await client.models.Recipient.delete({ id: duplicate.id })
      }
    }

    await fetchRecipients()
    alert(`Removed ${duplicates.length} duplicate recipient(s).`)
  } catch (err) {
    console.error('Error removing duplicates:', err)
    alert('Error removing duplicates. Please try again.')
  }
}

async function validateAddressBeforeSave(): Promise<boolean | null> {
  try {
    // Determine if this is a US or international address
    const country = form.value.country?.trim().toLowerCase() || ''
    const isUSAddress =
      !country || country === 'usa' || country === 'united states' || country === 'us'

    // Use USPS for US addresses, AddressZen for international
    if (!isUSAddress) {
      // International address - use AddressZen (Autocomplete → Resolve flow)
      console.log('Detected international address, country:', form.value.country)

      // Ensure proxy URL is loaded before checking
      await addresszenValidator.ensureProxyUrl()

      if (!addresszenValidator.isEnabled()) {
        console.warn(
          '⚠️ AddressZen not configured! Lambda proxy URL not found in amplify_outputs.json. Falling back to Geoapify.',
        )
        // Fallback to Geoapify if AddressZen not available
        if (!geoapifyValidator.isEnabled()) {
          console.warn(
            '⚠️ Geoapify also not configured! Set VITE_GEOAPIFY_API_KEY environment variable.',
          )
          console.log('Skipping international address validation')
          return null // Skip validation, proceed with save
        }

        // Use Geoapify as fallback
        console.log('Using Geoapify as fallback for international address')

        const address: GeoapifyAddress = {
          address1: form.value.address1 || '',
          address2: form.value.address2 || '',
          city: form.value.city || '',
          state: form.value.state || '',
          zipcode: form.value.zipcode || '',
          country: form.value.country || '',
        }

        const { primary, alternatives } =
          await geoapifyValidator.validateAddressWithAlternatives(address)
        isInternationalValidation.value = true

        console.log('Geoapify validation result:', primary)
        console.log('Geoapify alternatives count (raw):', alternatives.length)

        // Filter out alternatives that are identical to the primary result
        const uniqueAlternatives = alternatives.filter((alt) => {
          return (
            alt.address1.toLowerCase() !== primary.address1.toLowerCase() ||
            alt.city.toLowerCase() !== primary.city.toLowerCase() ||
            alt.state.toLowerCase() !== primary.state.toLowerCase() ||
            alt.zipcode !== primary.zipcode
          )
        })

        console.log('Geoapify alternatives count (unique):', uniqueAlternatives.length)

        // Only keep alternatives that have minimum confidence (10% or higher)
        const usefulAlternatives = uniqueAlternatives.filter((alt) => (alt.confidence || 0) >= 0.1)

        console.log('Geoapify alternatives with meaningful confidence:', usefulAlternatives.length)

        if (primary.error) {
          // Validation failed, show error dialog
          validationErrorMessage.value = primary.error
          validationErrorAddress.value = { ...form.value }
          showValidationErrorDialog.value = true
          return false // Pause save until user decides
        }

        // Check if we got a result (even with low confidence)
        if (primary.standardized) {
          // Check if address is different
          const isDifferent =
            primary.address1.toLowerCase() !== address.address1.toLowerCase() ||
            primary.city.toLowerCase() !== address.city.toLowerCase() ||
            primary.state.toLowerCase() !== address.state.toLowerCase() ||
            primary.zipcode !== address.zipcode

          if (isDifferent || usefulAlternatives.length > 0) {
            // Store both addresses and useful alternatives, show confirmation dialog
            // Only show alternatives section if there are alternatives with meaningful confidence
            originalAddress.value = { ...form.value }
            validatedAddressData.value = primary
            alternativeAddresses.value = usefulAlternatives
            showAlternatives.value = usefulAlternatives.length > 0 // Auto-show alternatives if available
            showAddressConfirmDialog.value = true
            return false // Pause save until user confirms
          } else if (primary.confidence >= 0.5) {
            // Address is valid, matches, and has good confidence - mark as validated
            form.value.addressValidationStatus = 'valid'
            form.value.addressValidationMessage = 'Verified by Geoapify'
            form.value.addressValidatedAt = new Date().toISOString()
          }
        }

        // No suggestions or address matches with low confidence, continue with save
        return null
      }

      console.log('Using AddressZen to validate international address (Autocomplete → Resolve)')

      const address: AddressZenAddress = {
        address1: form.value.address1 || '',
        address2: form.value.address2 || '',
        city: form.value.city || '',
        state: form.value.state || '',
        zipcode: form.value.zipcode || '',
        country: form.value.country || '',
      }

      const primary = await addresszenValidator.validateAddress(address)
      isInternationalValidation.value = true

      console.log('AddressZen validation result (International):', primary)

      if (primary.error) {
        // Validation failed, show error dialog
        validationErrorMessage.value = primary.error
        validationErrorAddress.value = { ...form.value }
        showValidationErrorDialog.value = true
        return false // Pause save until user decides
      }

      // Check if we got a result
      if (primary.standardized) {
        // Check if address is different
        const isDifferent =
          primary.address1.toLowerCase() !== address.address1.toLowerCase() ||
          (primary.city || '').toLowerCase() !== (address.city || '').toLowerCase() ||
          (primary.state || '').toLowerCase() !== (address.state || '').toLowerCase() ||
          primary.zipcode !== address.zipcode ||
          (primary.country || '').toLowerCase() !== (address.country?.toLowerCase() || '')

        if (isDifferent) {
          // Store both addresses and show confirmation dialog
          originalAddress.value = { ...form.value }
          validatedAddressData.value = primary
          alternativeAddresses.value = [] // AddressZen doesn't currently support alternatives in this flow
          showAlternatives.value = false
          showAddressConfirmDialog.value = true
          return false // Pause save until user confirms
        } else {
          // Address is valid, matches - mark as validated
          form.value.addressValidationStatus = 'valid'
          form.value.addressValidationMessage = 'Verified by AddressZen'
          form.value.addressValidatedAt = new Date().toISOString()
        }
      } else if (primary.deliverable) {
        // Address is deliverable - mark as valid
        form.value.addressValidationStatus = 'valid'
        form.value.addressValidationMessage = 'Verified by AddressZen'
        form.value.addressValidatedAt = new Date().toISOString()
      }

      // No suggestions or address matches with low confidence, continue with save
      return null
    }

    // US address - use USPS
    isInternationalValidation.value = false

    // Strip ZIP+4 to just 5 digits for USPS API (they'll add it back)
    let zipcode = form.value.zipcode || ''
    if (zipcode.includes('-')) {
      zipcode = zipcode.split('-')[0]
    }

    const address: USPSAddress = {
      address1: form.value.address1 || '',
      address2: form.value.address2 || '',
      city: form.value.city || '',
      state: form.value.state || '',
      zipcode: zipcode,
    }

    const result = await uspsValidator.validateAddress(address)

    if (result.error) {
      // Check if it's a quota exceeded error
      const isQuotaExceeded =
        result.error.toLowerCase().includes('quota') ||
        result.error.toLowerCase().includes('exceeded') ||
        result.error.toLowerCase().includes('rate limit') ||
        result.error.toLowerCase().includes('too many')

      if (isQuotaExceeded) {
        validationErrorMessage.value =
          'USPS API quota exceeded (60 calls/hour limit). The address has been saved, but validation will be processed in the background. You can edit and validate again later when the quota resets.'
        // Allow save without validation - background validation will handle it later
        form.value.addressValidationStatus = 'queued'
        form.value.addressValidationMessage = 'Queued for background validation (quota exceeded)'
        return null // Continue with save
      } else {
        // Other validation errors - show error dialog
        validationErrorMessage.value = result.error
        validationErrorAddress.value = { ...form.value }
        showValidationErrorDialog.value = true
        return false // Pause save until user decides
      }
    }

    if (result.standardized) {
      // Address was standardized by USPS (may or may not be deliverable)
      // Check if address is different
      const zipDifferent = result.zipcode && result.zipcode !== address.zipcode
      const isDifferent =
        result.address1.toLowerCase() !== address.address1.toLowerCase() ||
        result.city.toLowerCase() !== address.city.toLowerCase() ||
        result.state.toLowerCase() !== address.state.toLowerCase() ||
        zipDifferent ||
        (result.zipPlus4 && address.zipcode && !address.zipcode.includes(result.zipPlus4))

      if (isDifferent) {
        // Store both addresses and show confirmation dialog
        originalAddress.value = { ...form.value }
        validatedAddressData.value = result
        showAddressConfirmDialog.value = true
        return false // Pause save until user confirms
      } else {
        // Address is standardized and matches - mark as validated
        form.value.addressValidationStatus = result.deliverable ? 'valid' : 'invalid'
        form.value.addressValidationMessage = result.deliverable
          ? 'Verified by USPS'
          : 'Standardized by USPS (not deliverable)'
        form.value.addressValidatedAt = new Date().toISOString()
      }
    } else if (result.deliverable) {
      // Address is deliverable but not standardized - mark as valid
      form.value.addressValidationStatus = 'valid'
      form.value.addressValidationMessage = 'Verified by USPS'
      form.value.addressValidatedAt = new Date().toISOString()
    }

    // Address is valid - set country to USA if not specified
    if (result.deliverable && !form.value.country) {
      form.value.country = 'United States'
    }

    // Address is valid and same, continue with save
    return null
  } catch (err) {
    console.error('Error validating address:', err)
    // Show error dialog with exception details
    validationErrorMessage.value =
      err instanceof Error ? err.message : 'Unknown error occurred during validation'
    validationErrorAddress.value = { ...form.value }
    showValidationErrorDialog.value = true
    return false // Pause save until user decides
  }
}

function useValidatedAddress() {
  if (validatedAddressData.value) {
    form.value.address1 = validatedAddressData.value.address1
    form.value.address2 = validatedAddressData.value.address2 || ''
    form.value.city = validatedAddressData.value.city
    form.value.state = validatedAddressData.value.state

    // Handle zipcode differently for USPS vs Geoapify/AddressZen
    if (isInternationalValidation.value) {
      // Geoapify or AddressZen result
      form.value.zipcode = validatedAddressData.value.zipcode
      if ('country' in validatedAddressData.value) {
        form.value.country = validatedAddressData.value.country
      }
      // Determine which service was used
      const isAddressZen =
        'countryCode' in validatedAddressData.value &&
        !(
          'countryCode' in validatedAddressData.value &&
          (validatedAddressData.value as GeoapifyValidatedAddress).countryCode?.length === 0 &&
          'formatted' in validatedAddressData.value &&
          (validatedAddressData.value as GeoapifyValidatedAddress).formatted
        )
      form.value.addressValidationMessage = isAddressZen
        ? 'Verified by AddressZen'
        : 'Verified by Geoapify'
    } else {
      // USPS result
      const uspsData = validatedAddressData.value as USPSValidatedAddress
      const newZipcode = uspsData.zipcode + (uspsData.zipPlus4 ? `-${uspsData.zipPlus4}` : '')
      form.value.zipcode = newZipcode
      form.value.addressValidationMessage = 'Verified by USPS'
    }

    // Mark address as validated
    form.value.addressValidationStatus = 'valid'
    form.value.addressValidatedAt = new Date().toISOString()
  }
  showAddressConfirmDialog.value = false
  skipValidation.value = true // Skip validation on the next save call
  // Continue with save
  saveRecipient()
}

function useAlternativeAddress(alt: GeoapifyValidatedAddress) {
  // Use the selected alternative address
  form.value.address1 = alt.address1
  form.value.address2 = alt.address2 || ''
  form.value.city = alt.city
  form.value.state = alt.state
  form.value.zipcode = alt.zipcode
  if ('country' in alt) {
    form.value.country = alt.country
  }

  // Mark address as validated (user chose an alternative)
  form.value.addressValidationStatus = 'valid'
  form.value.addressValidationMessage = `Validated by Geoapify (${Math.round((alt.confidence || 0) * 100)}% confidence)`
  form.value.addressValidatedAt = new Date().toISOString()

  showAddressConfirmDialog.value = false
  skipValidation.value = true // Skip validation on the next save call
  // Continue with save
  saveRecipient()
}

function useOriginalAddress() {
  // Mark address as user-overridden (they chose to keep their version)
  form.value.addressValidationStatus = 'invalid'
  form.value.addressValidationMessage = 'Original address kept by user'
  form.value.addressValidatedAt = new Date().toISOString()

  showAddressConfirmDialog.value = false
  skipValidation.value = true // Skip validation on the next save call
  // Continue with save (form already has original values)
  saveRecipient()
}

function saveAddressDespiteError() {
  // User chose to save even though validation failed
  // Mark as invalid (not validated) but allow save
  form.value.addressValidationStatus = 'invalid'
  form.value.addressValidationMessage = cleanErrorMessage(validationErrorMessage.value)
  form.value.addressValidatedAt = new Date().toISOString()

  showValidationErrorDialog.value = false
  skipValidation.value = true // Skip validation on the next save call
  saveRecipient()
}

function cancelValidationError() {
  // User chose to go back and edit the address
  showValidationErrorDialog.value = false
  saving.value = false
  // Dialog stays open so user can edit
}

// Clean up error messages for better display
function cleanErrorMessage(error: string): string {
  // Try to extract the actual error message from JSON/API responses

  // Pattern 1: Extract "message" from USPS JSON error
  const messageMatch = error.match(/"message":\s*"([^"]+)"/)
  if (messageMatch && messageMatch[1]) {
    const message = messageMatch[1]

    // If it's a validation error, try to make it more readable
    if (message.includes('OASValidation') || message.includes('OpenAPI-Spec')) {
      // Extract the specific validation error
      if (message.includes('String') && message.includes('is too long')) {
        const fieldMatch = message.match(/String\s+(\w+)\s+is too long/)
        if (fieldMatch) {
          return `The ${fieldMatch[1]} field is too long. Please use the 2-letter state abbreviation (e.g., "PA" instead of "${fieldMatch[1]}").`
        }
        return 'One or more address fields are too long. Please use standard abbreviations (e.g., "PA" for Pennsylvania).'
      }

      if (message.includes('does not match input string')) {
        const inputMatch = message.match(/does not match input string\s+([^:]+)/)
        if (inputMatch) {
          const invalidValue = inputMatch[1].trim()
          return `Invalid state: "${invalidValue}". Please use a valid 2-letter state code (e.g., PA, NY, CA).`
        }
        return 'Invalid state code. Please use a valid 2-letter abbreviation (e.g., PA, NY, CA).'
      }

      // Generic validation error
      return 'The address format is invalid. Please check that all fields are filled correctly, especially the state (use 2-letter code like "PA").'
    }

    // Return the cleaned message
    return message
  }

  // Pattern 2: Look for specific error codes
  if (error.includes('Address Not Found') || error.includes('010005')) {
    return 'Address Not Found. The USPS database does not have a record of this address. Please verify the address is correct.'
  }

  if (error.includes('Invalid ZIP')) {
    return 'Invalid ZIP Code. The ZIP code does not match the city and state provided.'
  }

  if (error.includes('Insufficient')) {
    return 'Insufficient Address Information. Required address fields are missing (street, city, state, or ZIP).'
  }

  // Pattern 3: Geoapify errors
  if (error.includes('not found or could not be validated')) {
    return 'Address Not Found. This address could not be located in the geocoding database.'
  }

  if (error.includes('401') || error.includes('Unauthorized')) {
    return 'API Authentication Failed. The API credentials may be invalid or expired.'
  }

  if (error.includes('NetworkError') || error.includes('fetch')) {
    return 'Network Error. Unable to connect to the address validation service. Please check your internet connection.'
  }

  // If we can't parse it, try to shorten it by taking just the first sentence
  const firstSentence = error.split(/[.!?]\s/)[0]
  if (firstSentence.length < error.length && firstSentence.length < 150) {
    return firstSentence + '.'
  }

  // Last resort: return first 200 characters
  if (error.length > 200) {
    return error.substring(0, 200) + '...'
  }

  return error
}

// Generate suggested mailing name from name fields
function generateMailingName(): string {
  return generateMailingNameFromRecipient(form.value)
}

function generateMailingNameFromRecipient(recipient: Partial<Recipient>): string {
  const parts: string[] = []

  if (recipient.title?.trim()) {
    parts.push(recipient.title.trim())
  }

  if (recipient.firstName?.trim()) {
    parts.push(recipient.firstName.trim())
  }

  if (recipient.secondName?.trim()) {
    parts.push(recipient.secondName.trim())
  }

  if (recipient.lastName?.trim()) {
    parts.push(recipient.lastName.trim())
  }

  if (recipient.suffix?.trim()) {
    // Add comma before suffix
    if (parts.length > 0) {
      parts[parts.length - 1] += ','
    }
    parts.push(recipient.suffix.trim())
  }

  return parts.join(' ')
}

// Address autocomplete functions
function clearAddressSuggestions() {
  // Clear suggestions immediately when moving to another field
  // This prevents the dropdown from covering other fields
  addressSuggestions.value = []

  // Abort any pending autocomplete requests
  if (autocompleteAbortController) {
    autocompleteAbortController.abort()
    autocompleteAbortController = null
  }
}

async function searchAddress(event: { query: string }) {
  const query = event.query?.trim()

  console.log('searchAddress called with query:', query)

  // Cancel any previous request
  if (autocompleteAbortController) {
    autocompleteAbortController.abort()
  }

  if (!query || query.length < 3) {
    addressSuggestions.value = []
    return
  }

  // Check if Geoapify is enabled
  if (!geoapifyAutocomplete.isEnabled()) {
    console.warn(
      'Geoapify autocomplete is not enabled. Set VITE_GEOAPIFY_API_KEY environment variable.',
    )
    addressSuggestions.value = []
    return
  }

  // Create new abort controller for this request
  autocompleteAbortController = new AbortController()
  const currentController = autocompleteAbortController

  // Use country filter if specified
  const countryFilter = form.value.country || undefined

  try {
    console.log('Fetching address suggestions for:', query, 'country:', countryFilter)
    const suggestions = await geoapifyAutocomplete.getSuggestions(query, countryFilter)

    // Only update suggestions if this request wasn't aborted
    if (currentController === autocompleteAbortController) {
      console.log('Received suggestions:', suggestions)
      addressSuggestions.value = suggestions
    }
  } catch (error) {
    // Ignore abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Autocomplete request aborted')
      return
    }
    console.error('Error fetching address suggestions:', error)
    addressSuggestions.value = []
  }
}

function onAddressSelect(event: { value: AddressSuggestion }) {
  console.log('onAddressSelect called with event:', event)
  const suggestion = event.value
  console.log('Suggestion value:', suggestion)

  if (!suggestion) {
    console.warn('No suggestion provided')
    return
  }

  // Auto-fill all address fields from the selected suggestion
  form.value.address1 = suggestion.address1 || ''
  form.value.address2 = suggestion.address2 || ''
  form.value.city = suggestion.city || ''
  form.value.state = suggestion.state || ''
  form.value.zipcode = suggestion.zipcode || ''
  form.value.country = suggestion.country || ''

  console.log('Address auto-filled from suggestion:', {
    address1: form.value.address1,
    city: form.value.city,
    state: form.value.state,
    zipcode: form.value.zipcode,
    country: form.value.country,
  })

  // Clear suggestions after selection
  addressSuggestions.value = []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onAddressChange(event: any) {
  console.log('onAddressChange called with event:', event)

  // Check if the value is an object (a suggestion was selected)
  if (event.value && typeof event.value === 'object') {
    console.log('Change detected - calling onAddressSelect')
    onAddressSelect({ value: event.value })
  }
}

// Update mailing name suggestion as user types
function updateMailingName() {
  // Always update the suggestion
  const suggested = generateMailingName()
  suggestedMailingName.value = suggested

  // Only auto-fill if user hasn't manually edited the mailing name field
  if (!mailingNameManuallyEdited.value) {
    form.value.mailingName = suggested
  }
}

// Handle manual input to mailing name field
function onMailingNameInput() {
  // Check if the user typed something different from the auto-generated value
  if (form.value.mailingName !== suggestedMailingName.value) {
    mailingNameManuallyEdited.value = true
  }
}

// AutoComplete search functions
function searchTitle(event: { query: string }) {
  const query = event.query?.toLowerCase() || ''
  if (!query || query.trim() === '') {
    // Show all options when empty or just spaces
    filteredTitles.value = [...titleOptions.value]
  } else {
    // Filter based on query
    filteredTitles.value = titleOptions.value.filter((title) => title.toLowerCase().includes(query))
  }
}

function searchSuffix(event: { query: string }) {
  const query = event.query?.toLowerCase() || ''
  if (!query || query.trim() === '') {
    // Show all options when empty or just spaces
    filteredSuffixes.value = [...suffixOptions.value]
  } else {
    // Filter based on query
    filteredSuffixes.value = suffixOptions.value.filter((suffix) =>
      suffix.toLowerCase().includes(query),
    )
  }
}

// Lifecycle
// Polling for validation status updates
let pollingInterval: number | null = null

function startValidationPolling() {
  // Check if there are any recipients with queued status or addresses without validation
  const hasQueuedValidations = recipients.value.some(
    (r) => r.address1 && (!r.addressValidationStatus || r.addressValidationStatus === 'queued'),
  )

  if (hasQueuedValidations && !pollingInterval) {
    console.log('📡 Starting validation status polling...')
    pollingInterval = window.setInterval(() => {
      fetchRecipients(true).then(() => {
        // Stop polling if no more queued validations
        const stillQueued = recipients.value.some(
          (r) =>
            r.address1 && (!r.addressValidationStatus || r.addressValidationStatus === 'queued'),
        )
        if (!stillQueued && pollingInterval) {
          console.log('✅ All validations complete, stopping polling')
          window.clearInterval(pollingInterval)
          pollingInterval = null
        }
      })
    }, 3000) // Poll every 3 seconds
  }
}

function stopValidationPolling() {
  if (pollingInterval) {
    window.clearInterval(pollingInterval)
    pollingInterval = null
  }
}

onMounted(() => {
  fetchRecipients()

  // Remove dropdown buttons from tab order
  setTimeout(() => {
    const dropdownButtons = document.querySelectorAll('.p-autocomplete-dropdown')
    dropdownButtons.forEach((button) => {
      button.setAttribute('tabindex', '-1')
    })
  }, 100)
})

onUnmounted(() => {
  stopValidationPolling()
})
</script>

<style scoped>
/* Make placeholder text lighter and more obviously a hint */
:deep(.p-inputtext::placeholder) {
  color: #cbd5e1; /* Tailwind slate-300 - much lighter gray */
  opacity: 1;
  font-style: italic;
}

:deep(.p-inputtext:focus::placeholder) {
  color: #e2e8f0; /* Even lighter when focused (slate-200) */
}

/* Fix AutoComplete width to fit in grid */
:deep(.p-autocomplete) {
  width: 100%;
}

:deep(.p-autocomplete-input) {
  width: 100%;
}

:deep(.p-autocomplete-panel) {
  max-width: 300px;
}

/* Make dropdown button narrower */
:deep(.p-autocomplete-dropdown) {
  width: 2rem !important;
  min-width: 2rem !important;
}

:deep(.p-autocomplete-dropdown .p-button-icon) {
  font-size: 0.875rem;
}
</style>
