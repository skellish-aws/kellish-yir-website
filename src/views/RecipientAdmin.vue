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
      <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-300">{{ totalRecipients }}</div>
        <div class="text-sm text-blue-600 dark:text-blue-300">Total Recipients</div>
      </div>
      <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
        <div class="text-2xl font-bold text-green-600 dark:text-green-300">{{ codesUsed }}</div>
        <div class="text-sm text-green-600 dark:text-green-300">Codes Used</div>
      </div>
      <div class="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{{ codesUnused }}</div>
        <div class="text-sm text-yellow-600 dark:text-yellow-300">Codes Unused</div>
      </div>
      <div class="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-300">{{ sendCards }}</div>
        <div class="text-sm text-purple-600 dark:text-purple-300">Send Cards</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-4">
      <div class="flex gap-4 items-center">
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
          optionLabel="label"
          optionValue="value"
          placeholder="Filter by status"
          class="w-48"
          @change="filterRecipients"
        />
        <div class="flex items-center gap-2 bg-red-50 dark:bg-red-900 px-3 py-2 rounded border border-red-200 dark:border-red-700">
          <Checkbox
            v-model="showInvalidAddressesOnly"
            inputId="invalidAddresses"
            :binary="true"
            @change="filterRecipients"
          />
          <label for="invalidAddresses" class="text-sm font-medium text-red-700 dark:text-red-300 cursor-pointer">
            Show Invalid/Error/No Address
          </label>
        </div>
      </div>
      <div class="text-xs text-gray-500 mt-1 ml-1">
        Searches: Name, Email, City, State, Access Code
      </div>
    </div>

    <!-- Recipients List -->
    <div v-if="loading" class="flex justify-center">
      <ProgressSpinner />
    </div>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <!-- Header Row -->
      <div class="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 font-semibold text-sm text-gray-700 dark:text-gray-200">
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
          class="px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b dark:border-gray-700"
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
              <div v-if="recipient.mailingName" class="text-xs text-gray-400 dark:text-gray-400">
                {{ recipient.firstName }} {{ recipient.lastName }}
              </div>
              <div v-else class="text-sm text-gray-500 dark:text-gray-300">{{ recipient.title }}</div>
            </div>

            <!-- Address -->
            <div class="col-span-2">
              <div class="flex items-start gap-2">
                <div class="flex-1">
                  <div v-if="recipient.address1" class="text-sm text-gray-900 dark:text-gray-100">{{ recipient.address1 }}</div>
                  <div v-if="recipient.address2" class="text-sm text-gray-600 dark:text-gray-300">
                    {{ recipient.address2 }}
                  </div>
                  <div
                    v-if="recipient.city || recipient.state || recipient.zipcode"
                    class="text-sm text-gray-500 dark:text-gray-300"
                  >
                    {{
                      [recipient.city, recipient.state, recipient.zipcode]
                        .filter(Boolean)
                        .join(', ')
                    }}
                  </div>
                  <div
                    v-if="!recipient.address1 && !recipient.city"
                    class="text-sm text-gray-400 dark:text-gray-500 italic"
                  >
                    No address
                  </div>
                </div>

                <!-- Validation Status Icon -->
                <div v-if="recipient.address1" class="flex-shrink-0 mt-0.5">
                  <i
                    v-if="recipient.addressValidationStatus === 'valid'"
                    class="pi pi-check-circle text-green-600 dark:text-green-400 text-sm"
                    :title="recipient.addressValidationMessage || 'Address verified'"
                  ></i>
                  <i
                    v-else-if="recipient.addressValidationStatus === 'invalid'"
                    class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-sm"
                    :title="recipient.addressValidationMessage || 'Address could not be validated'"
                  ></i>
                  <i
                    v-else-if="recipient.addressValidationStatus === 'error'"
                    class="pi pi-times-circle text-red-600 dark:text-red-400 text-sm"
                    :title="recipient.addressValidationMessage || 'Validation failed'"
                  ></i>
                  <i
                    v-else-if="recipient.addressValidationStatus === 'queued'"
                    class="pi pi-clock text-blue-600 dark:text-blue-400 text-sm animate-pulse"
                    title="Validation in progress..."
                  ></i>
                  <i
                    v-else
                    class="pi pi-question-circle text-gray-400 dark:text-gray-500 text-sm"
                    title="Not yet validated"
                  ></i>
                </div>
              </div>
            </div>

            <!-- Access Code -->
            <div class="col-span-2">
              <div
                v-if="recipient.accessCode"
                class="font-mono text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 rounded"
              >
                {{ recipient.accessCode }}
              </div>
              <div v-else class="text-gray-400 dark:text-gray-500 text-sm">No code</div>
            </div>

            <!-- Status -->
            <div class="col-span-2">
              <div class="flex flex-col gap-1">
                <span
                  :class="{
                    'text-green-600 dark:text-green-400': recipient.accessCodeUsed,
                    'text-yellow-600 dark:text-yellow-400': !recipient.accessCodeUsed && recipient.accessCode,
                    'text-gray-400 dark:text-gray-500': !recipient.accessCode,
                  }"
                  class="text-sm font-medium"
                >
                  {{
                    recipient.accessCodeUsed ? 'Used' : recipient.accessCode ? 'Unused' : 'No Code'
                  }}
                </span>
                <span
                  :class="{
                    'text-green-600 dark:text-green-400': recipient.sendCard,
                    'text-red-600 dark:text-red-400': !recipient.sendCard,
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
                  class="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                  title="Edit recipient"
                >
                  <i class="pi pi-pencil text-sm"></i>
                </button>
                <button
                  @click="regenerateCode(recipient)"
                  class="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                  title="Regenerate code"
                >
                  <i class="pi pi-refresh text-sm"></i>
                </button>
                <button
                  @click="deleteRecipient(recipient)"
                  class="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded"
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
        <!-- Warning banner for international addresses -->
        <div
          v-if="form.country && !isUSCountry(form.country)"
          class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-3 flex items-start gap-2"
        >
          <i class="pi pi-info-circle text-blue-600 dark:text-blue-300 mt-0.5"></i>
          <div class="text-sm text-blue-800 dark:text-blue-200">
            <strong>International address validation:</strong>
            Google Maps Address Validation will be used when you save this address.
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
            class="text-xs text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded mt-1 inline-block"
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
            </label>
            <InputText
              v-model="form.address1"
              placeholder="Enter address"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Address 2</label>
            <InputText v-model="form.address2" class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-1">City</label>
            <InputText v-model="form.city" class="w-full" />
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

        <div v-if="form.accessCode" class="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Access Code</label>
          <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{{ form.accessCode }}</div>
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
        <p class="text-sm text-gray-600 dark:text-gray-300">
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
          <h4 class="font-medium mb-2 text-gray-900 dark:text-gray-100">Preview ({{ importPreview.length }} recipients):</h4>
          <div class="space-y-1">
            <div
              v-for="(recipient, index) in importPreview.slice(0, 10)"
              :key="index"
              class="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
            >
              {{ recipient.firstName }} {{ recipient.lastName }} - {{ recipient.city }},
              {{ recipient.state }}
            </div>
            <div v-if="importPreview.length > 10" class="text-sm text-gray-500 dark:text-gray-400">
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
          Google Maps Address Validation returned a standardized version of this address. Which would
          you like to use?
        </p>

        <div class="grid grid-cols-2 gap-4">
          <!-- Original Address -->
          <div class="border rounded p-3 bg-gray-50 dark:bg-gray-800">
            <h4 class="font-semibold text-sm text-gray-600 dark:text-gray-300 mb-2">Your Address:</h4>
            <div class="text-sm text-gray-900 dark:text-gray-100" v-if="originalAddress">
              <div v-if="originalAddress.address1" class="text-gray-900 dark:text-gray-100">{{ originalAddress.address1 }}</div>
              <div v-else class="text-gray-400 dark:text-gray-500 italic">(no street address)</div>
              <div v-if="originalAddress.address2" class="text-gray-900 dark:text-gray-100">{{ originalAddress.address2 }}</div>
              <div class="text-gray-900 dark:text-gray-100">
                <template v-if="originalAddress.city || originalAddress.state || originalAddress.zipcode">
                  <span v-if="originalAddress.city">{{ originalAddress.city }}</span>
                  <span v-if="originalAddress.city && originalAddress.state">, </span>
                  <template v-if="originalAddress.state">
                    {{ originalAddress.state }}
                    <template v-if="originalAddress.zipcode">&nbsp;</template>
                  </template>
                  <span v-if="originalAddress.zipcode">{{ originalAddress.zipcode }}</span>
                </template>
              </div>
              <div v-if="originalAddress.country" class="text-gray-900 dark:text-gray-100">{{ originalAddress.country }}</div>
            </div>
            <div v-else class="text-sm text-gray-400 dark:text-gray-500 italic">No address data</div>
          </div>

          <!-- Validated Address -->
          <div class="border rounded p-3 bg-green-50 dark:bg-green-900 border-green-300 dark:border-green-700">
            <h4 class="font-semibold text-sm text-green-700 dark:text-green-300 mb-2">
              Google Maps Validated:
              <span
                v-if="
                  validatedAddressData &&
                  'confidence' in validatedAddressData
                "
                class="text-xs font-normal text-gray-600 dark:text-gray-400"
              >
                ({{ Math.round((validatedAddressData.confidence || 0) * 100) }}% confidence)
              </span>
            </h4>
            <div class="text-sm text-gray-900 dark:text-gray-100" v-if="validatedAddressData">
              <div v-if="validatedAddressData.address1" class="text-gray-900 dark:text-gray-100">{{ validatedAddressData.address1 }}</div>
              <div v-else class="text-gray-400 dark:text-gray-500 italic">(no street address)</div>
              <div v-if="validatedAddressData.address2" class="text-gray-900 dark:text-gray-100">{{ validatedAddressData.address2 }}</div>
              <div class="text-gray-900 dark:text-gray-100">
                <template v-if="validatedAddressData.city || validatedAddressData.state || validatedAddressData.zipcode">
                  <span v-if="validatedAddressData.city">{{ validatedAddressData.city }}</span>
                  <span v-if="validatedAddressData.city && validatedAddressData.state">, </span>
                  <template v-if="validatedAddressData.state">
                    {{ validatedAddressData.state }}
                    <template v-if="validatedAddressData.zipcode">&nbsp;</template>
                  </template>
                  <span v-if="validatedAddressData.zipcode">{{ validatedAddressData.zipcode }}</span>
                </template>
              </div>
              <div v-if="validatedAddressData.country" class="text-gray-900 dark:text-gray-100">
                {{ validatedAddressData.country }}
              </div>
            </div>
            <div v-else class="text-sm text-gray-400 dark:text-gray-500 italic">No validated address data</div>
          </div>
        </div>

        <!-- Show Alternatives Button (if available) -->
        <div
          v-if="alternativeAddresses.length > 0"
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
          <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-200">Other Possible Matches:</h4>
          <div
            v-for="(alt, index) in alternativeAddresses"
            :key="index"
            class="border rounded p-3 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-gray-900 dark:text-gray-100"
            @click="useAlternativeAddress(alt)"
          >
            <div class="flex justify-between items-start">
              <div class="text-sm flex-1">
                <div>{{ alt.address1 }}</div>
                <div v-if="alt.address2">{{ alt.address2 }}</div>
                <div>{{ alt.city }}, {{ alt.state }} {{ alt.zipcode }}</div>
                <div v-if="alt.country">{{ alt.country }}</div>
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400 ml-2">
                {{ Math.round((alt.confidence || 0) * 100) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Use My Address" class="p-button-outlined" @click="useOriginalAddress" />
        <Button
              :label="`Use Google Maps Address`"
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
              Google Maps could not validate this address:
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
              Google Maps database. You can save it as entered, or go back and correct it.
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
import {
  googlemapsValidator,
  type GoogleMapsAddress,
  type GoogleMapsValidatedAddress,
} from '../utils/googlemaps-validator.ts'
import amplifyOutputs from '../../amplify_outputs.json'
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
const showInvalidAddressesOnly = ref(false)
const importPreview = ref<Recipient[]>([])
const sortField = ref<string>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Address validation state
const showAddressConfirmDialog = ref(false)
const showValidationErrorDialog = ref(false)
const originalAddress = ref<Partial<Recipient>>({})
const validatedAddressData = ref<GoogleMapsValidatedAddress | null>(null)
const alternativeAddresses = ref<GoogleMapsValidatedAddress[]>([]) // Store alternative matches
const showAlternatives = ref(false) // Toggle to show/hide alternatives
const skipValidation = ref(false) // Flag to skip validation after user confirms
const validationErrorMessage = ref('')
const validationErrorAddress = ref<Partial<Recipient>>({})

// Mailing name auto-generation
const mailingNameManuallyEdited = ref(false)
const suggestedMailingName = ref('')

// Address autocomplete (removed - using Google Maps validation only)

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
  { label: 'Address Valid', value: 'addrvalid' },
  { label: 'Address Invalid', value: 'addrinvalid' },
  { label: 'Address Error', value: 'addrerror' },
  { label: 'Address Queued', value: 'addrqueued' },
  { label: 'Address Pending', value: 'addrpending' },
  { label: 'Address Not Validated', value: 'addrnotvalidated' },
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
    case 'addrvalid':
      filtered = filtered.filter((r) => r.addressValidationStatus === 'valid')
      break
    case 'addrinvalid':
      filtered = filtered.filter((r) => r.addressValidationStatus === 'invalid')
      break
    case 'addrerror':
      filtered = filtered.filter((r) => r.addressValidationStatus === 'error')
      break
    case 'addrqueued':
      filtered = filtered.filter((r) => r.addressValidationStatus === 'queued')
      break
    case 'addrpending':
      filtered = filtered.filter((r) => r.addressValidationStatus === 'pending')
      break
    case 'addrnotvalidated':
      filtered = filtered.filter(
        (r) => r.address1 && !r.addressValidationStatus,
      )
      break
  }

  // Filter for invalid/error addresses or no address
  if (showInvalidAddressesOnly.value) {
    filtered = filtered.filter(
      (r) =>
        !r.address1 || // No address
        r.addressValidationStatus === 'invalid' ||
        r.addressValidationStatus === 'error',
    )
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
      recipients.value = allRecipients
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
    // For US addresses, we need city (state can be auto-filled). For international, address1 and country are sufficient.
    const country = form.value.country?.trim().toLowerCase() || ''
    const isUSAddress =
      !country || country === 'usa' || country === 'united states' || country === 'us'
    const hasMinimumAddressInfo =
      form.value.address1?.trim() &&
      (isUSAddress
        ? form.value.city?.trim() // US: need city (state can be auto-filled from validation)
        : form.value.country?.trim()) // International: just need country

    if (!skipValidation.value && hasMinimumAddressInfo) {
      const validationResult = await validateAddressBeforeSave()

      // If validation returned false, it means user needs to confirm or validation failed
      if (validationResult === false) {
        saving.value = false
        return
      }
      // If validation returned true or null, continue with save
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

      const updateResult = await client.models.Recipient.update(updateData)

      if (updateResult.errors && updateResult.errors.length > 0) {
        console.error('Recipient update errors:', updateResult.errors)
        console.error('First error details:', JSON.stringify(updateResult.errors[0], null, 2))
        const errorMessage =
          updateResult.errors[0].message ||
          updateResult.errors[0].errorType ||
          JSON.stringify(updateResult.errors[0])
        alert(`Error updating recipient: ${errorMessage}`)
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

      const result = await client.models.Recipient.create(createData)

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


      // Now update with additional fields that aren't in CreateRecipientInput
      if (result.data && result.data.id) {
        const updateData = {
          id: result.data.id,
          sendCard: recipientData.sendCard ?? true,
          accessCode: recipientData.accessCode,
          accessCodeUsed: recipientData.accessCodeUsed ?? false,
          updatedAt: now,
        }

        const updateResult = await client.models.Recipient.update(updateData)

        if (updateResult.errors && updateResult.errors.length > 0) {
          console.error('Recipient update errors:', updateResult.errors)
          alert(`Error updating recipient: ${updateResult.errors[0].message || 'Unknown error'}`)
        } else {
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
  // Reset autocomplete (removed - using Google Maps validation only)
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

    // Send all addresses to queue (Google Maps handles both US and international)
    const batchSize = 50
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const response = await fetch(QUEUE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error(
          `Failed to queue batch ${i / batchSize + 1}: ${response.status}`,
          errorText,
        )
      }
    }

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
    // Use Google Maps for both US and international addresses
    // Ensure Google Maps validator is configured
    await googlemapsValidator.ensureProxyUrl()

    const isEnabled = googlemapsValidator.isEnabled()
    
    if (!isEnabled) {
      const errorMsg =
        'Google Maps Address Validation is not configured. ' +
        'Please ensure:\n' +
        '1. The Amplify backend is deployed (npm run amplify:sandbox)\n' +
        '2. amplify_outputs.json contains googlemapsProxyUrl\n' +
        '3. The Google Maps API key is set in SSM Parameter Store (/kellish-yir/googlemaps/api-key)'

      console.error('[Google Maps Error] Configuration missing:', errorMsg)

      validationErrorMessage.value = errorMsg
      validationErrorAddress.value = { ...form.value }
      showValidationErrorDialog.value = true
      return false // Block save - configuration must be fixed
    }

    const address: GoogleMapsAddress = {
      address1: form.value.address1 || '',
      address2: form.value.address2 || '',
      city: form.value.city || '',
      state: form.value.state || '',
      zipcode: form.value.zipcode || '',
      country: form.value.country || '',
    }

    const result = await googlemapsValidator.validateAddress(address)

    if (result.error) {
      // Validation failed - show detailed error
      // Check if error message already includes "Google Maps validation failed" to avoid duplication
      const baseError = result.error.includes('Google Maps validation failed') 
        ? result.error 
        : `Google Maps validation failed: ${result.error}`
      
      const detailedError = 
        `${baseError}\n\n` +
        `Address attempted: ${address.address1}, ${address.city}, ${address.state}, ${address.zipcode}, ${address.country}\n\n` +
        `This may be due to:\n` +
        `- Address not found in Google Maps database\n` +
        `- API key issues (check SSM parameter /kellish-yir/googlemaps/api-key)\n` +
        `- Address Validation API not enabled in Google Cloud Console\n` +
        `- Billing not set up for Google Cloud project\n` +
        `- Network/connectivity issues\n` +
        `- Invalid address format`

      console.error('[Google Maps Error] Validation failed:', {
        error: result.error,
        address,
        result,
      })

      validationErrorMessage.value = detailedError
      validationErrorAddress.value = { ...form.value }
      showValidationErrorDialog.value = true
      return false // Pause save until user decides
    }

    // Check if we got a standardized result
    if (result.standardized || result.deliverable) {
      // Normalize zipcodes for comparison (handle empty vs null vs value)
      const normalizedResultZipcode = (result.zipcode || '').trim()
      const normalizedFormZipcode = (address.zipcode || '').trim()
      
      // Auto-fill missing zipcode if Google provides one
      if (normalizedResultZipcode && !normalizedFormZipcode) {
        form.value.zipcode = normalizedResultZipcode
      }
      
      // Normalize addresses for comparison
      // Combine address1 + address2 for both form and result to handle cases where
      // Google combines apartment numbers into address1
      const normalizeAddressLine = (addr1: string, addr2?: string): string => {
        const combined = `${addr1 || ''} ${addr2 || ''}`.trim()
        // Normalize apartment number variations (APT, Apt, apt, #, etc.)
        // Keep the apartment number but normalize the prefix
        // Note: We don't normalize street type abbreviations (Ave vs Avenue) because
        // Google's abbreviations are intentional standardization recommendations
        return combined
          .toLowerCase()
          .replace(/\b(apt|apartment|unit|ste|suite)\s*/gi, '') // Remove prefix, keep number
          .replace(/#\s*/g, '') // Remove # symbol
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
      }
      
      const normalizedFormAddress = normalizeAddressLine(
        address.address1 || '',
        address.address2
      )
      const normalizedResultAddress = normalizeAddressLine(
        result.address1 || '',
        result.address2
      )
      
      // Normalize city, state, and country for comparison (handle case and whitespace)
      const normalizeText = (text: string | null | undefined): string => {
        return (text || '').toLowerCase().trim().replace(/\s+/g, ' ')
      }
      
      const normalizedFormCity = normalizeText(address.city)
      const normalizedResultCity = normalizeText(result.city)
      const normalizedFormState = normalizeText(address.state)
      const normalizedResultState = normalizeText(result.state)
      const normalizedFormCountry = normalizeText(address.country)
      const normalizedResultCountry = normalizeText(result.country)
      
      // Check if address is different (ignoring zipcode if it was just auto-filled)
      const isDifferent =
        normalizedFormAddress !== normalizedResultAddress ||
        normalizedFormCity !== normalizedResultCity ||
        normalizedFormState !== normalizedResultState ||
        // Only compare zipcode if both are present
        (normalizedFormZipcode && normalizedResultZipcode && normalizedResultZipcode !== normalizedFormZipcode) ||
        normalizedFormCountry !== normalizedResultCountry

      if (isDifferent) {
        // Store both addresses and show confirmation dialog
        // Store original address with proper structure
        originalAddress.value = {
          address1: address.address1 || form.value.address1 || '',
          address2: address.address2 || form.value.address2 || '',
          city: address.city || form.value.city || '',
          state: address.state || form.value.state || '',
          zipcode: address.zipcode || form.value.zipcode || '',
          country: address.country || form.value.country || '',
        }
        validatedAddressData.value = result
        alternativeAddresses.value = result.alternatives || []
        showAlternatives.value = alternativeAddresses.value.length > 0
        
        showAddressConfirmDialog.value = true
        return false // Pause save until user confirms
      } else {
        // Address is valid, matches - update any missing fields and mark as validated
        if (normalizedResultZipcode && !normalizedFormZipcode) {
          form.value.zipcode = normalizedResultZipcode
        }
        if (result.state && !form.value.state?.trim()) {
          form.value.state = result.state
        }
        if (result.city && !form.value.city?.trim()) {
          form.value.city = result.city
        }
        if (result.country && !form.value.country) {
          form.value.country = result.country
        }
        
        form.value.addressValidationStatus = result.deliverable ? 'valid' : 'invalid'
        form.value.addressValidationMessage = result.deliverable
          ? 'Verified by Google Maps'
          : 'Standardized by Google Maps (not deliverable)'
        form.value.addressValidatedAt = new Date().toISOString()
      }
    } else if (result.deliverable) {
      // Address is deliverable but not standardized - update missing fields and mark as valid
      if (result.zipcode && !form.value.zipcode?.trim()) {
        form.value.zipcode = result.zipcode
      }
      if (result.state && !form.value.state?.trim()) {
        form.value.state = result.state
      }
      if (result.city && !form.value.city?.trim()) {
        form.value.city = result.city
      }
      if (result.country && !form.value.country) {
        form.value.country = result.country
      }
      
      form.value.addressValidationStatus = 'valid'
      form.value.addressValidationMessage = 'Verified by Google Maps'
      form.value.addressValidatedAt = new Date().toISOString()
    }

    // Address is valid and same, continue with save
    return null
  } catch (err) {
    console.error('Error validating address:', err)
    validationErrorMessage.value =
      err instanceof Error ? err.message : 'Unknown error occurred during validation'
    validationErrorAddress.value = { ...form.value }
    showValidationErrorDialog.value = true
    return false
  }
}

function useValidatedAddress() {
  if (validatedAddressData.value) {
    form.value.address1 = validatedAddressData.value.address1
    form.value.address2 = validatedAddressData.value.address2 || ''
    form.value.city = validatedAddressData.value.city
    form.value.state = validatedAddressData.value.state

    // Handle validated address (Google Maps)
    if (validatedAddressData.value) {
      form.value.zipcode = validatedAddressData.value.zipcode
      if (validatedAddressData.value.country) {
        form.value.country = validatedAddressData.value.country
      }
      form.value.addressValidationMessage = 'Verified by Google Maps'
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

function useAlternativeAddress(alt: GoogleMapsValidatedAddress) {
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
  form.value.addressValidationMessage = `Validated by Google Maps (${Math.round((alt.confidence || 0) * 100)}% confidence)`
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

  // Pattern 1: Extract error message from JSON
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
    return 'Address Not Found. The address could not be validated. Please verify the address is correct.'
  }

  if (error.includes('Invalid ZIP')) {
    return 'Invalid ZIP Code. The ZIP code does not match the city and state provided.'
  }

  if (error.includes('Insufficient')) {
    return 'Insufficient Address Information. Required address fields are missing (street, city, state, or ZIP).'
  }

  // Pattern 3: General API errors
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

// Address autocomplete functions (removed - using Google Maps validation only)
function clearAddressSuggestions() {
  // No-op - autocomplete removed
}

async function searchAddress(event: { query: string }) {
  // No-op - autocomplete removed (Google Maps validation is used instead)
}

// Address autocomplete removed - using Google Maps validation only

// Address autocomplete removed - using Google Maps validation only

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
    pollingInterval = window.setInterval(() => {
      fetchRecipients(true).then(() => {
        // Stop polling if no more queued validations
        const stillQueued = recipients.value.some(
          (r) =>
            r.address1 && (!r.addressValidationStatus || r.addressValidationStatus === 'queued'),
        )
        if (!stillQueued && pollingInterval) {
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
