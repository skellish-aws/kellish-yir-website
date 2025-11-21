# Testing Guide

**Purpose**: Comprehensive step-by-step guide for testing the Year-in-Review newsletter website from first deployment through all features

**Approach**: This guide walks you through testing every element of the site in the exact sequence it would be used after deployment, ensuring thorough coverage of all functionality.

---

## Part 1: Initial Deployment & Setup

### Step 1.1: Deploy Backend Infrastructure

**Objective**: Verify the backend deploys successfully and all AWS resources are created.

- [ ] **Start Amplify Sandbox**:

```bash
# Terminal 1: Start Amplify sandbox
AWS_PROFILE=softsys npx ampx sandbox
```

- Wait for deployment to complete (~5-10 minutes)
- Verify no errors in deployment output
- Note the User Pool ID from the output (you'll need this)

- [ ] **Verify AWS Resources Created**:

  - [ ] Cognito User Pool exists
  - [ ] DynamoDB tables created (Recipient, Newsletter, AccessCode, NewsletterUser, NewsletterAccessLink)
  - [ ] S3 bucket created for file storage
  - [ ] Lambda functions created (address-validator, usps-proxy, geoapify-proxy, queue-address-validation)
  - [ ] SQS queue created for address validation

- [ ] **Start Frontend Development Server**:

```bash
# Terminal 2: Start dev server
npm run dev
```

- Verify server starts without errors
- Note the local URL (typically `http://localhost:5173`)

---

### Step 1.2: Configure SSM Parameters (Required for Address Validation)

**Objective**: Set up secure API keys in AWS Systems Manager Parameter Store.

- [ ] **Create Geoapify API Key Parameter**:

  ```bash
  aws ssm put-parameter \
    --name "/kellish-yir/geoapify/api-key" \
    --type "SecureString" \
    --value "11b3be8a12b94e7789be6c299450d3c0" \
    --region us-east-1 \
    --profile softsys
  ```

  - Verify parameter created successfully

- [ ] **Create USPS Consumer Key Parameter**:

  ```bash
  aws ssm put-parameter \
    --name "/kellish-yir/usps/consumer-key" \
    --type "SecureString" \
    --value "YOUR_USPS_CONSUMER_KEY" \
    --region us-east-1 \
    --profile softsys
  ```

  - Replace `YOUR_USPS_CONSUMER_KEY` with actual key
  - Verify parameter created

- [ ] **Create USPS Consumer Secret Parameter**:

  ```bash
  aws ssm put-parameter \
    --name "/kellish-yir/usps/consumer-secret" \
    --type "SecureString" \
    --value "YOUR_USPS_CONSUMER_SECRET" \
    --region us-east-1 \
    --profile softsys
  ```

  - Replace `YOUR_USPS_CONSUMER_SECRET` with actual secret
  - Verify parameter created

- [ ] **Verify Lambda Environment Variables**:
  - [ ] Check that Lambda functions have access to SQS queue URL
  - [ ] Verify `RECIPIENT_TABLE_NAME` environment variable is set to `Recipient`
  - [ ] If missing, set via AWS Console or CLI (see `READY_TO_DEPLOY.md`)

---

### Step 1.3: Create Initial Admin User

**Objective**: Create the first administrator account to access admin features.

- [ ] **Find User Pool ID**:

  ```bash
  aws cognito-idp list-user-pools \
    --max-results 60 \
    --profile softsys \
    --region us-east-1
  ```

  - Locate the user pool for your Amplify app
  - Copy the User Pool ID (format: `us-east-1_XXXXXXXXX`)

- [ ] **Create Admin Group** (if not exists):

  ```bash
  aws cognito-idp create-group \
    --group-name Admin \
    --user-pool-id <USER_POOL_ID> \
    --description "Administrators of the Year-in-Review app" \
    --profile softsys \
    --region us-east-1
  ```

  - If group already exists, error is expected and can be ignored

- [ ] **Create Admin User**:

  ```bash
  aws cognito-idp admin-create-user \
    --user-pool-id <USER_POOL_ID> \
    --username admin@example.com \
    --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
    --message-action SUPPRESS \
    --temporary-password "TempP@ssword123!" \
    --profile softsys \
    --region us-east-1
  ```

  - Replace `admin@example.com` with your actual email
  - Replace `TempP@ssword123!` with a secure temporary password

- [ ] **Add User to Admin Group**:

  ```bash
  aws cognito-idp admin-add-user-to-group \
    --user-pool-id <USER_POOL_ID> \
    --username admin@example.com \
    --group-name Admin \
    --profile softsys \
    --region us-east-1
  ```

- [ ] **Set Permanent Password**:
  ```bash
  aws cognito-idp admin-set-user-password \
    --user-pool-id <USER_POOL_ID> \
    --username admin@example.com \
    --password "YourSecurePassword123!" \
    --permanent \
    --profile softsys \
    --region us-east-1
  ```
  - Replace with your desired permanent password
  - Verify user created successfully

**Alternative**: Use the helper script if available:

```bash
./helper-scripts/seed-admin.sh
```

---

## Part 2: First Access & Authentication Testing

### Step 2.1: Test Unauthenticated Access

**Objective**: Verify that unauthenticated users are properly redirected and cannot access protected resources.

- [ ] **Visit Home Page** (`/`):

  - Open browser to `http://localhost:5173/`
  - **Expected**: Should automatically redirect to `/login`
  - Verify login page displays correctly

- [ ] **Try to Access Admin Pages Directly**:

  - [ ] Visit `http://localhost:5173/admin/newsletters`
    - **Expected**: Should redirect to `/login`
  - [ ] Visit `http://localhost:5173/admin/recipients`
    - **Expected**: Should redirect to `/login`

- [ ] **Test Invalid Registration Link**:

  - [ ] Visit `http://localhost:5173/register?code=INVALID-CODE`
    - **Expected**: Should show error message "Invalid invitation link" or similar
    - Verify error message is user-friendly

- [ ] **Test Registration Page Without Code**:
  - [ ] Visit `http://localhost:5173/register`
    - **Expected**: Should show registration form with access code field
    - Verify form is accessible without code parameter

---

### Step 2.2: Test Admin Login

**Objective**: Verify admin user can successfully log in and access admin features.

- [ ] **Login as Admin**:

  - Go to `/login` page
  - Enter admin email: `admin@example.com` (or your admin email)
  - Enter password: `YourSecurePassword123!` (or your password)
  - Click "Sign In"
  - **Expected**: Should successfully authenticate and redirect to `/` (home page)

- [ ] **Verify Admin Access**:

  - [ ] Check that navigation menu shows admin links (if present)
  - [ ] Verify you can access `/admin/newsletters` without redirect
  - [ ] Verify you can access `/admin/recipients` without redirect
  - [ ] Check browser console for any authentication errors

- [ ] **Test Session Persistence**:

  - [ ] Close browser tab
  - [ ] Reopen and navigate to `http://localhost:5173/`
  - **Expected**: Should remain logged in (if within session timeout)
  - [ ] Verify you can still access admin pages

- [ ] **Test Logout**:
  - [ ] Click logout button (if present) or manually clear session
  - **Expected**: Should redirect to home, then to login
  - [ ] Verify you cannot access admin pages after logout

---

## Part 3: Admin Setup - Recipient Management

### Step 3.1: Test Recipient List View

**Objective**: Verify the recipient admin interface loads and displays correctly.

- [ ] **Navigate to Recipient Admin**:

  - Login as admin (if not already logged in)
  - Go to `/admin/recipients`
  - **Expected**: Should load recipient management page

- [ ] **Verify Empty State**:

  - [ ] If no recipients exist, verify "No recipients" or empty state message displays
  - [ ] Verify "Add Recipient" button is visible and functional
  - [ ] Verify "Import Recipients" button is visible (if present)

- [ ] **Check UI Elements**:
  - [ ] Verify search/filter box is present
  - [ ] Verify table/list structure is visible
  - [ ] Verify column headers are correct (Name, Email, Address, Validation Status, etc.)

---

### Step 3.2: Test Adding a Single Recipient

**Objective**: Verify you can create a recipient manually and address validation is triggered.

- [ ] **Add First Recipient**:

  - Click "Add Recipient" button
  - Fill in the form:
    - **Name**: "John Doe"
    - **Email**: "john.doe@example.com"
    - **Address Line 1**: "1015 S Sixth Street"
    - **City**: "Philadelphia"
    - **State**: "PA"
    - **Zip Code**: "19147"
    - **Country**: "United States"
  - Click "Create" or "Save"
  - **Expected**: Should create recipient and show success message

- [ ] **Verify Recipient Created**:

  - [ ] Recipient should appear in the list
  - [ ] Verify all entered data is displayed correctly
  - [ ] Check that validation status shows "queued" or "pending" initially

- [ ] **Test Address Validation** (US Address):

  - [ ] Wait 1-2 minutes for validation to process
  - [ ] Refresh the recipient list
  - [ ] **Expected**: Validation status should update to:
    - ✓ Green checkmark = valid address
    - ⚠️ Yellow warning = invalid address (with message)
    - ❌ Red X = validation error
  - [ ] Verify validation message is displayed (if address is invalid)
  - [ ] Check CloudWatch logs for Lambda function execution (if needed)

- [ ] **Test International Address**:
  - [ ] Add another recipient with international address:
    - **Name**: "Maria Silva"
    - **Email**: "maria.silva@example.com"
    - **Address Line 1**: "Avenida Diogo Cão, N15 - 2C"
    - **City**: "Loures"
    - **State/Province**: (leave blank or use appropriate field)
    - **Country**: "Portugal"
  - [ ] Save recipient
  - [ ] Wait for validation
  - [ ] Verify international address validation works (may use Geoapify)

---

### Step 3.3: Test Recipient Import (CSV/Excel)

**Objective**: Verify bulk import functionality works correctly.

- [ ] **Prepare Test CSV File**:

  - Create a CSV file with multiple recipients:
    ```csv
    Name,Email,Address1,City,State,ZipCode,Country
    Jane Smith,jane.smith@example.com,123 Main St,New York,NY,10001,United States
    Bob Johnson,bob.johnson@example.com,456 Oak Ave,Los Angeles,CA,90001,United States
    Alice Williams,alice.williams@example.com,789 Pine Rd,Chicago,IL,60601,United States
    ```
  - Save as `test-recipients.csv`

- [ ] **Import Recipients**:

  - Click "Import Recipients" button
  - Select the CSV file
  - **Expected**: Should show preview of recipients to be imported
  - [ ] Verify preview shows correct data mapping
  - [ ] Click "Confirm Import" or "Import"
  - **Expected**: Should import all recipients successfully

- [ ] **Verify Import Results**:

  - [ ] All imported recipients should appear in the list
  - [ ] Verify data is correctly parsed and displayed
  - [ ] Check that all recipients show "queued" validation status
  - [ ] Wait for validation to process
  - [ ] Verify validation statuses update correctly

- [ ] **Test Import Error Handling**:
  - [ ] Try importing invalid CSV (missing required columns)
    - **Expected**: Should show error message
  - [ ] Try importing CSV with duplicate emails
    - **Expected**: Should handle gracefully (either skip or show error)

---

### Step 3.4: Test Recipient Search and Filter

**Objective**: Verify search and filtering functionality works.

- [ ] **Test Search by Name**:

  - Enter "John" in search box
  - **Expected**: Should filter to show only recipients with "John" in name
  - Clear search
  - Verify all recipients shown again

- [ ] **Test Search by Email**:

  - Enter "jane" in search box
  - **Expected**: Should show recipients with "jane" in email
  - Clear search

- [ ] **Test Search by City**:

  - Enter "Philadelphia" in search box
  - **Expected**: Should show recipients in Philadelphia
  - Clear search

- [ ] **Test Search by State**:

  - Enter "NY" in search box
  - **Expected**: Should show recipients in New York
  - Clear search

- [ ] **Test No Results**:
  - Enter "XYZ123" in search box
  - **Expected**: Should show "No results" or empty state
  - Clear search

---

### Step 3.5: Test Editing Recipients

**Objective**: Verify recipient data can be updated.

- [ ] **Edit Existing Recipient**:

  - Click "Edit" on a recipient
  - Modify name: "John Doe" → "John M. Doe"
  - Modify address: Change zip code to "19148"
  - Click "Save" or "Update"
  - **Expected**: Should update recipient successfully

- [ ] **Verify Changes Saved**:

  - [ ] Recipient should show updated name
  - [ ] Address should show updated zip code
  - [ ] Validation status should reset to "queued" (if address changed)
  - [ ] Wait for re-validation

- [ ] **Test Changing Inviter** (if applicable):
  - [ ] Edit recipient
  - [ ] Change "Invited By" field (if present)
  - [ ] Save
  - [ ] Verify inviter field updated

---

### Step 3.6: Test Deleting Recipients

**Objective**: Verify recipients can be deleted.

- [ ] **Delete Single Recipient**:

  - Select a recipient (check box or click)
  - Click "Delete" button
  - **Expected**: Should show confirmation dialog
  - Confirm deletion
  - **Expected**: Recipient should be removed from list

- [ ] **Test Bulk Delete**:

  - [ ] Select multiple recipients (check boxes)
  - [ ] Click "Delete" button
  - [ ] **Expected**: Should show confirmation with count
  - [ ] Confirm deletion
  - [ ] **Expected**: All selected recipients should be removed

- [ ] **Verify Deletion**:
  - [ ] Refresh page
  - [ ] Verify deleted recipients do not reappear
  - [ ] Check that associated access codes are handled correctly (if any)

---

## Part 4: Access Code Generation & Management

### Step 4.1: Verify Access Codes Are Auto-Generated

**Objective**: Verify access codes are automatically generated for all recipients.

- [ ] **Verify New Recipients Have Codes**:

  - [ ] After creating a recipient (from Part 2), verify it has an access code
  - [ ] After importing recipients (from Part 2), verify all imported recipients have access codes
  - [ ] **Expected**: All recipients should have access codes automatically (format: `KEL-XXXX-XXXX`)
  - [ ] Verify codes are unique across all recipients

- [ ] **Verify Code Properties**:

  - [ ] Check that codes follow format `KEL-XXXX-XXXX`
  - [ ] Verify codes show as "unused" initially
  - [ ] Verify codes are linked to correct recipients
  - [ ] Check that AccessCode records are created with correct inviter information

### Step 4.2: Regenerate Access Codes (Security/Administrative Use)

**Objective**: Verify access codes can be regenerated for security purposes (e.g., if a code was compromised or shared inappropriately).

**Note**: This is an administrative feature for edge cases. In normal operation, recipients use their auto-generated codes. Regeneration is primarily for invalidating compromised codes.

- [ ] **Regenerate Code for Single Recipient**:

  - [ ] Select one recipient that has an access code but has NOT yet registered (`accessCodeUsed = false`)
  - [ ] Note the current access code value
  - [ ] Click the refresh icon (regenerate code button) next to the recipient
  - [ ] **Expected**: Should generate a new unique access code
  - [ ] Verify new code appears in recipient row (format: `KEL-XXXX-XXXX`)
  - [ ] Verify new code is different from the old one
  - [ ] Verify code is unique (not used by any other recipient)
  - [ ] Verify `accessCodeUsed` remains `false` (code is still available for registration)

**Note**: Testing that old codes are invalidated will be covered in Part 6.5 after registration has been tested.

- [ ] **Regenerate Codes for Multiple Recipients** (unregistered only):

  - [ ] Select 3-5 recipients that have access codes but have NOT yet registered
  - [ ] Note the current access codes
  - [ ] Click "Regenerate Codes" button
  - [ ] **Expected**: Should regenerate unique codes for all selected recipients
  - [ ] Verify each recipient has a new unique code
  - [ ] Verify all codes follow format `KEL-XXXX-XXXX`
  - [ ] Verify old codes are replaced (not duplicated)
  - [ ] Verify all selected recipients have `accessCodeUsed` set to `false` (codes are available for registration)

**Note**: Testing regenerate functionality with registered recipients will be covered in Part 6.5 after the registration process has been tested.

---

### Step 4.3: Test Access Code Display and Copy

**Objective**: Verify access codes can be viewed and copied for distribution.

- [ ] **View Access Code**:

  - [ ] Verify access code is visible in recipient list
  - [ ] Verify each access code has a copy button (copy icon) next to it
  - [ ] **Expected**: Copy button should be visible and clickable

- [ ] **Test Copy Registration URL to Clipboard**:

  - [ ] Click the copy button (copy icon) next to an access code
  - [ ] **Expected**: Should copy full registration URL to clipboard silently (no alert)
  - [ ] **Expected**: Toast notification should appear in top-right corner with:
    - White background with dark text (for readability)
    - Green checkmark icon
    - "Copied!" summary text
    - "Registration URL copied to clipboard" detail text
    - Green left border indicating success
    - Auto-dismisses after 3 seconds
  - [ ] Verify toast does not overlap with green buttons in the toolbar
  - [ ] Paste in text editor or address bar to verify
  - [ ] Verify URL format: `http://localhost:5173/register?code=KEL-XXXX-XXXX`
  - [ ] Verify the URL contains the correct access code
  - [ ] Test with multiple recipients to ensure each code generates correct URL

- [ ] **Test On-Demand Code Generation** (if Inviter role exists):
  - [ ] As admin, generate single on-demand code
  - [ ] **Expected**: Should create code with 6-month expiration (if different from bulk)
  - [ ] Verify code tracks inviter/admin who created it

---

## Part 5: Newsletter Management

### Step 5.1: Test Newsletter List View

**Objective**: Verify newsletter admin interface loads correctly.

- [ ] **Navigate to Newsletter Admin**:

  - Go to `/admin/newsletters`
  - **Expected**: Should load newsletter management page

- [ ] **Verify Empty State**:

  - [ ] If no newsletters exist, verify empty state message
  - [ ] Verify "Add Newsletter" or "Upload Newsletter" button is visible

- [ ] **Check UI Elements**:
  - [ ] Verify newsletter list/grid structure
  - [ ] Verify columns/fields are correct (Title, Year, Upload Date, etc.)

---

### Step 5.2: Upload First Newsletter

**Objective**: Verify newsletter upload functionality works end-to-end.

- [ ] **Prepare Test Files**:

  - Locate sample files in `samples/2024 YIR/`:
    - `KellishFamily2024YIRNewsletter.pdf` (newsletter PDF)
    - `2024CardFront.png` (card front image)
    - `2024CardBack.png` (card back image)
  - Verify files exist and are accessible

- [ ] **Upload Newsletter**:

  - Click "Add Newsletter" or "Upload Newsletter"
  - Fill in form:
    - **Title**: "2024 Year in Review"
    - **Year**: "2024"
    - **PDF File**: Select `KellishFamily2024YIRNewsletter.pdf`
    - **Card Front** (optional): Select `2024CardFront.png`
    - **Card Back** (optional): Select `2024CardBack.png`
  - Click "Upload" or "Create"
  - **Expected**: Should show upload progress

- [ ] **Verify Upload Success**:

  - [ ] Wait for upload to complete
  - [ ] **Expected**: Should show success message
  - [ ] Newsletter should appear in the list
  - [ ] Verify title and year are correct

- [ ] **Verify Thumbnail Generation**:

  - [ ] Wait 30-60 seconds for thumbnail processing
  - [ ] Refresh page
  - [ ] **Expected**: Newsletter should show PDF thumbnail/preview
  - [ ] Verify thumbnail is visible and correct

- [ ] **Verify Card Images**:

  - [ ] Newsletter card should show card image previews (if uploaded)
  - [ ] Verify front and back card images are displayed

- [ ] **Verify PDF Metadata**:
  - [ ] Check that page count is displayed (if extracted)
  - [ ] Verify file size or other metadata (if shown)

---

### Step 5.3: Test Newsletter Viewing (Admin)

**Objective**: Verify admins can view newsletters they upload.

- [ ] **View Newsletter in Admin**:

  - Click on newsletter in admin list
  - **Expected**: Should open newsletter detail view or preview
  - [ ] Verify PDF is accessible
  - [ ] Verify card images are accessible

- [ ] **Test PDF Viewer** (if implemented in admin):

  - [ ] Click "View" or "Preview" button
  - [ ] **Expected**: PDF should open in dialog or new tab
  - [ ] Verify PDF displays correctly
  - [ ] Test scrolling through PDF pages

- [ ] **Test Download** (if available in admin):
  - [ ] Click "Download" button
  - [ ] **Expected**: PDF should download with correct filename
  - [ ] Verify filename format: `{Newsletter-Title}.pdf`

---

### Step 5.4: Test Editing Newsletter

**Objective**: Verify newsletter metadata can be updated.

- [ ] **Edit Newsletter**:

  - Click "Edit" on existing newsletter
  - Modify title: "2024 Year in Review" → "2024 Family Year in Review"
  - Modify year (if needed)
  - Click "Save"
  - **Expected**: Should update successfully

- [ ] **Verify Changes**:

  - [ ] Newsletter should show updated title
  - [ ] Verify changes persist after page refresh

- [ ] **Test Replacing Files** (if allowed):
  - [ ] Try to upload new PDF for existing newsletter
  - [ ] **Expected**: Should either allow replacement or show appropriate message
  - [ ] Verify behavior matches design

---

### Step 5.5: Test Deleting Newsletter

**Objective**: Verify newsletters can be deleted.

- [ ] **Delete Newsletter**:

  - Select newsletter
  - Click "Delete" button
  - **Expected**: Should show confirmation dialog
  - Confirm deletion
  - **Expected**: Newsletter should be removed from list

- [ ] **Verify Deletion**:

  - [ ] Refresh page
  - [ ] Verify newsletter does not reappear
  - [ ] Verify associated files are removed from S3 (check S3 bucket if needed)

- [ ] **Test Bulk Delete** (if available):
  - [ ] Upload 2-3 test newsletters
  - [ ] Select multiple newsletters
  - [ ] Click "Delete"
  - [ ] Confirm
  - [ ] **Expected**: All selected newsletters should be deleted

---

### Step 5.6: Upload Multiple Newsletters

**Objective**: Verify system handles multiple newsletters correctly.

- [ ] **Upload Additional Newsletters**:

  - Upload newsletter for "2023 Year in Review" (use same PDF or create test)
  - Upload newsletter for "2022 Year in Review"
  - **Expected**: All should upload successfully

- [ ] **Verify List Display**:
  - [ ] All newsletters should appear in list
  - [ ] Verify newsletters are sorted by year (newest first)
  - [ ] Verify each newsletter shows correct thumbnail and metadata

---

## Part 6: User Registration Flow

### Step 6.1: Test Registration with Valid Access Code

**Objective**: Verify the complete registration flow works for a new user.

- [ ] **Get Valid Access Code**:

  - As admin, go to `/admin/recipients`
  - Find a recipient with an access code (or generate one)
  - Copy the access code (format: `KEL-XXXX-XXXX`)
  - Note the recipient's email and zip code (you'll need these for testing)

- [ ] **Open Registration Page**:

  - Open new incognito/private browser window (to simulate new user)
  - Navigate to: `http://localhost:5173/register?code=KEL-XXXX-XXXX`
    - Replace `KEL-XXXX-XXXX` with actual code
  - **Expected**: Should load registration form
  - **Expected**: Access code field should be pre-filled

- [ ] **Verify Access Code Validation**:

  - [ ] Form should show code is valid (green checkmark or similar)
  - [ ] If code is invalid, should show error immediately
  - [ ] Verify code format validation works

- [ ] **Fill Registration Form**:

  - **Name**: "Test User" (or match recipient name)
  - **Zip Code**: Enter zip code from recipient record (if required)
  - **Email**: Use a test email (e.g., `testuser@example.com`)
  - **Password**: Enter strong password (e.g., `Test123!@#`)
  - **Confirm Password**: Re-enter same password

- [ ] **Submit Registration**:

  - Click "Register" or "Create Account"
  - **Expected**: Should show "Registration successful" or similar message
  - **Expected**: Should redirect to home page or show email verification prompt

- [ ] **Verify Account Creation**:
  - [ ] Check Cognito User Pool (via AWS Console or CLI) - user should exist
  - [ ] Check NewsletterUser table - record should be created
  - [ ] Verify access code is marked as "used" in database
  - [ ] Verify `usedBy` field links to new user

---

### Step 6.2: Test Email Verification

**Objective**: Verify email verification flow works.

- [ ] **Check for Verification Email**:

  - Check email inbox for verification code
  - **Expected**: Should receive email with verification code
  - Note the verification code

- [ ] **Complete Email Verification**:

  - If redirected to verification page, enter code
  - Or go to login page and enter email + password
  - **Expected**: Should prompt for verification code
  - Enter verification code from email
  - **Expected**: Should verify successfully

- [ ] **Verify User Can Login**:
  - After verification, try to login
  - Enter email and password
  - **Expected**: Should login successfully
  - **Expected**: Should redirect to home page

---

### Step 6.3: Test Registration Error Cases

**Objective**: Verify registration handles errors gracefully.

- [ ] **Test Invalid Access Code**:

  - Visit `/register?code=INVALID-CODE`
  - **Expected**: Should show "Invalid invitation link" error
  - Verify error message is clear and helpful

- [ ] **Test Expired Access Code**:

  - Create test code with short expiration (if possible)
  - Wait for expiration
  - Try to register with expired code
  - **Expected**: Should show "This invitation link has expired" error

- [ ] **Test Used Access Code**:

  - Try to register again with the same code used in Step 6.1
  - **Expected**: Should show "This invitation link has already been used" error

- [ ] **Test Duplicate Email**:

  - Try to register with email that already exists
  - **Expected**: Should show "An account with this email already exists" error
  - Verify recovery options are provided (if implemented)

- [ ] **Test Weak Password**:

  - Try to register with weak password (e.g., "123")
  - **Expected**: Should show password strength requirements
  - Verify password validation works

- [ ] **Test Missing Required Fields**:

  - Try to submit form with empty required fields
  - **Expected**: Should show validation errors for each missing field
  - Verify all required fields are validated

- [ ] **Test Invalid Email Format**:

  - Enter invalid email (e.g., "notanemail")
  - **Expected**: Should show email format validation error

- [ ] **Test Password Mismatch**:
  - Enter different passwords in "Password" and "Confirm Password"
  - **Expected**: Should show "Passwords do not match" error

---

### Step 6.5: Test Regenerate Codes with Registered Recipients

**Objective**: Verify regenerate code functionality works correctly with recipients who have already registered.

**Prerequisites**: Complete Step 6.1 to have at least one recipient who has registered.

- [ ] **Test Disabled Regenerate Button for Registered Recipient**:

  - [ ] As admin, go to `/admin/recipients`
  - [ ] Find a recipient who has already registered (from Step 6.1)
  - [ ] Verify the recipient shows `accessCodeUsed = true` in the list
  - [ ] **Expected**: Regenerate button (refresh icon) should be disabled (grayed out)
  - [ ] Hover over the disabled button
  - [ ] **Expected**: Tooltip should show "Cannot regenerate code: recipient has already registered"

- [ ] **Test Old Code Invalidation After Regeneration**:

  - [ ] As admin, regenerate a code for a recipient who has NOT yet registered
  - [ ] Note the old code that was replaced
  - [ ] Open a new incognito/private browser window
  - [ ] Try to register using the old code: `http://localhost:5173/register?code=OLD-CODE`
  - [ ] **Expected**: Should show "Invalid invitation link" error (old code is no longer valid)
  - [ ] Try to register using the new code: `http://localhost:5173/register?code=NEW-CODE`
  - [ ] **Expected**: Should accept the new code and allow registration

- [ ] **Test Bulk Regenerate with Mixed Recipients**:

  - [ ] Select a mix of recipients: some with unused codes and some who have already registered
  - [ ] Note the current access codes for recipients who haven't registered
  - [ ] Click "Regenerate Codes" button
  - [ ] **Expected**: Should regenerate unique codes only for recipients who haven't registered yet
  - [ ] **Expected**: Should skip recipients who have already registered
  - [ ] Verify alert message shows how many codes were regenerated and how many were skipped
  - [ ] Verify each unregistered recipient has a new unique code
  - [ ] Verify all codes follow format `KEL-XXXX-XXXX`
  - [ ] Verify old codes are replaced (not duplicated) for unregistered recipients
  - [ ] Verify registered recipients' codes remain unchanged
  - [ ] Verify only unregistered recipients have `accessCodeUsed` reset to `false`

- [ ] **Test Bulk Regenerate with All Registered Recipients**:

  - [ ] Select only recipients who have already registered
  - [ ] Click "Regenerate Codes" button
  - [ ] **Expected**: Alert should show "All selected recipients have already registered. Cannot regenerate codes for recipients who have already registered."
  - [ ] Verify no codes were changed

---

## Part 7: Viewer Access - Newsletter Viewing

### Step 7.1: Test Home Page (Authenticated Viewer)

**Objective**: Verify authenticated users can view newsletters on the home page.

- [ ] **Login as Viewer User**:

  - Use the test user created in Step 6.1
  - Login at `/login`
  - **Expected**: Should redirect to `/` (home page)

- [ ] **Verify Home Page Loads**:

  - [ ] Home page should display "Year-in-Review Newsletters" heading
  - [ ] Should show newsletter grid/list
  - [ ] Verify newsletters uploaded in Step 5.2 are visible

- [ ] **Verify Newsletter Display**:

  - [ ] Each newsletter card should show:
    - Thumbnail/preview image
    - Title
    - Year
    - Page count (if available)
    - "View" button
    - "Download" button
  - [ ] Card images should be visible (if newsletter has cards)

- [ ] **Verify Newsletter Sorting**:

  - [ ] Newsletters should be sorted by year (newest first)
  - [ ] Verify sorting is correct

- [ ] **Test Empty State**:
  - [ ] If no newsletters exist, should show "No newsletters available yet" message
  - [ ] Message should be user-friendly

---

### Step 7.2: Test Newsletter Viewing (PDF Viewer)

**Objective**: Verify users can view newsletters in the browser.

- [ ] **Open Newsletter Viewer**:

  - Click "View" button on a newsletter
  - **Expected**: Should open PDF in dialog/modal

- [ ] **Verify PDF Viewer**:

  - [ ] PDF should load and display correctly
  - [ ] Should be able to scroll through pages
  - [ ] Verify PDF is readable and not corrupted
  - [ ] Check that all pages are accessible

- [ ] **Test Dialog Controls**:

  - [ ] Close button (X) should work
  - [ ] Clicking outside dialog should close it (if modal)
  - [ ] ESC key should close dialog (if implemented)

- [ ] **Test Multiple Newsletters**:
  - [ ] View different newsletters
  - [ ] Verify each opens correctly
  - [ ] Verify no conflicts between different PDFs

---

### Step 7.3: Test Newsletter Download

**Objective**: Verify users can download newsletters.

- [ ] **Download Newsletter**:

  - Click "Download" button on a newsletter
  - **Expected**: PDF should download to browser's download folder

- [ ] **Verify Download**:

  - [ ] Check download folder for PDF file
  - [ ] Verify filename format: `{Newsletter-Title}.pdf` (e.g., "2024 Year in Review.pdf")
  - [ ] Open downloaded PDF
  - [ ] Verify PDF is complete and not corrupted
  - [ ] Verify file size matches original

- [ ] **Test Download for Multiple Newsletters**:
  - [ ] Download different newsletters
  - [ ] Verify each downloads with correct filename
  - [ ] Verify no filename conflicts

---

### Step 7.4: Test Card Image Viewing

**Objective**: Verify card images can be viewed and downloaded.

- [ ] **View Card Images** (if newsletter has cards):

  - [ ] Card previews should be visible in newsletter card
  - [ ] Click on card front image
  - [ ] **Expected**: Should open card image in dialog

- [ ] **Verify Card Image Dialog**:

  - [ ] Card image should display at full size
  - [ ] Should be able to view front and back (if both exist)
  - [ ] Verify image quality is good
  - [ ] Close button should work

- [ ] **Test Card Image Download** (if implemented):
  - [ ] Right-click or use download button on card image
  - [ ] **Expected**: Should download card image
  - [ ] Verify filename is appropriate

---

### Step 7.5: Test Viewer Access Restrictions

**Objective**: Verify viewers cannot access admin features.

- [ ] **Try to Access Admin Pages**:

  - As viewer user, try to visit `/admin/newsletters`
    - **Expected**: Should redirect to home page (not login, since already authenticated)
  - [ ] Try to visit `/admin/recipients`
    - **Expected**: Should redirect to home page

- [ ] **Verify No Admin UI Elements**:
  - [ ] Check navigation menu (if present)
  - [ ] Verify no admin links are visible to viewer users
  - [ ] Verify user role is correctly identified

---

## Part 8: Advanced Admin Features

### Step 8.1: Test Address Validation Status

**Objective**: Verify address validation statuses are displayed and updated correctly.

- [ ] **Check Validation Status Icons**:

  - Go to `/admin/recipients`
  - [ ] Verify status icons are displayed:
    - ✓ Green checkmark = valid address
    - ⚠️ Yellow warning = invalid address
    - ❌ Red X = validation error
    - ⏳ Pulsing/spinner = queued (processing)
    - ? Gray = pending (not yet validated)

- [ ] **Test Validation Status Updates**:

  - [ ] Create new recipient with valid US address
  - [ ] Verify status shows "queued" initially
  - [ ] Wait 1-2 minutes
  - [ ] Refresh page
  - [ ] Verify status updated to "valid" (green checkmark)

- [ ] **Test Invalid Address Handling**:

  - [ ] Create recipient with obviously invalid address (e.g., "123 Fake St, Nowhere, ZZ, 00000")
  - [ ] Wait for validation
  - [ ] Verify status shows "invalid" (yellow warning)
  - [ ] Verify validation message is displayed

- [ ] **Test Validation Error Handling**:
  - [ ] Check CloudWatch logs if validation fails
  - [ ] Verify error status is displayed correctly
  - [ ] Verify error messages are user-friendly

---

### Step 8.2: Test Manual Address Validation (if implemented)

**Objective**: Verify admins can manually trigger address validation.

- [ ] **Trigger Manual Validation**:

  - Select recipient with "pending" or "error" status
  - Click "Validate Address" or "Re-validate" button (if present)
  - **Expected**: Should trigger validation process

- [ ] **Verify Re-validation**:
  - [ ] Status should change to "queued"
  - [ ] Wait for processing
  - [ ] Verify status updates correctly

---

### Step 8.3: Test Bulk Operations

**Objective**: Verify bulk operations work correctly.

- [ ] **Bulk Generate Access Codes**:

  - Select 5-10 recipients without codes
  - Click "Generate Access Codes" (bulk)
  - **Expected**: Should create codes for all selected recipients
  - [ ] Verify all codes are unique
  - [ ] Verify all codes have correct expiration (1 year)

- [ ] **Bulk Delete Recipients**:

  - Select multiple recipients
  - Click "Delete"
  - **Expected**: Should show confirmation with count
  - Confirm
  - **Expected**: All selected should be deleted

- [ ] **Bulk Export** (if implemented):
  - [ ] Select multiple recipients
  - [ ] Click "Export" (if available)
  - [ ] **Expected**: Should export CSV/Excel with selected recipients

---

## Part 9: Edge Cases & Error Handling

### Step 9.1: Test Network Error Handling

**Objective**: Verify application handles network issues gracefully.

- [ ] **Test Offline Behavior**:

  - Disconnect internet
  - Try to load home page
  - **Expected**: Should show appropriate error message
  - Try to upload newsletter
  - **Expected**: Should show network error

- [ ] **Test Slow Connection**:

  - Use browser dev tools to throttle connection (Slow 3G)
  - Load home page
  - **Expected**: Should show loading indicators
  - Upload newsletter
  - **Expected**: Should show upload progress

- [ ] **Test API Timeout**:
  - [ ] If API calls timeout, verify error messages are shown
  - [ ] Verify retry mechanisms work (if implemented)

---

### Step 9.2: Test Large File Uploads

**Objective**: Verify system handles large files correctly.

- [ ] **Test Large PDF Upload**:

  - Try to upload PDF > 50MB (if you have one)
  - **Expected**: Should either:
    - Upload successfully (if within limits)
    - Show file size limit error (if exceeds limit)
  - Verify error message is clear

- [ ] **Test Invalid File Types**:
  - Try to upload non-PDF file as newsletter
    - **Expected**: Should show "Invalid file type" error
  - Try to upload non-image file as card
    - **Expected**: Should show validation error

---

### Step 9.3: Test Session Management

**Objective**: Verify session handling works correctly.

- [ ] **Test Inactivity Timeout**:

  - Login as user
  - Wait 15+ minutes without activity (or configured timeout)
  - Try to perform action
  - **Expected**: Should redirect to login or show session expired message

- [ ] **Test Multiple Tabs**:

  - Open site in two browser tabs
  - Login in one tab
  - **Expected**: Other tab should also show logged in state
  - Logout in one tab
  - **Expected**: Other tab should also log out

- [ ] **Test Token Refresh**:
  - [ ] Verify tokens refresh automatically (check network tab)
  - [ ] Verify user stays logged in during token refresh

---

### Step 9.4: Test Data Validation

**Objective**: Verify all input validation works correctly.

- [ ] **Test XSS Prevention**:

  - Try to enter `<script>alert('XSS')</script>` in name field
  - Submit form
  - **Expected**: Script should be sanitized or rejected
  - Verify no scripts execute

- [ ] **Test SQL Injection** (if applicable):

  - Try to enter SQL injection attempts in search fields
  - **Expected**: Should be handled safely

- [ ] **Test File Upload Validation**:
  - Try to upload file with malicious name
  - Try to upload file with executable extension
  - **Expected**: Should be rejected or sanitized

---

## Part 10: Performance & Security Testing

### Step 10.1: Performance Testing

**Objective**: Verify application performs well under normal usage.

- [ ] **Test Page Load Times**:

  - Measure time to load home page (should be < 2 seconds)
  - Measure time to load admin pages
  - Measure time to load newsletter list with 10+ newsletters
  - **Expected**: All should load within acceptable time

- [ ] **Test Newsletter List Rendering**:

  - Upload 10+ newsletters
  - Load home page
  - **Expected**: Should render all newsletters without lag
  - Verify pagination or lazy loading works (if implemented)

- [ ] **Test PDF Loading**:

  - Open large PDF (79MB if available)
  - **Expected**: Should load and display within reasonable time
  - Verify progress indicators show during loading

- [ ] **Test Image Thumbnail Generation**:
  - Upload newsletter with large PDF
  - **Expected**: Thumbnail should generate within 1-2 minutes
  - Verify thumbnail quality is acceptable

---

### Step 10.2: Security Testing

**Objective**: Verify security measures are in place.

- [ ] **Test Authentication Bypass**:

  - Try to access API endpoints directly without auth token
  - **Expected**: Should return 401/403 error

- [ ] **Test Authorization**:

  - As viewer user, try to call admin API endpoints
  - **Expected**: Should return 403 Forbidden

- [ ] **Test Access Code Security**:

  - Try to guess access codes (brute force)
  - **Expected**: Should have rate limiting or other protections
  - Verify codes are sufficiently random

- [ ] **Test S3 URL Expiration**:

  - Get S3 presigned URL for newsletter
  - Wait 1+ hour
  - Try to access URL
  - **Expected**: Should be expired and return error

- [ ] **Test Password Security**:

  - Verify passwords are not visible in network requests (check DevTools)
  - Verify passwords are hashed in database
  - Test password strength requirements

- [ ] **Test HTTPS** (in production):
  - [ ] Verify all connections use HTTPS
  - [ ] Verify no mixed content warnings

---

## Part 11: Cross-Browser & Responsive Testing

### Step 11.1: Browser Compatibility

**Objective**: Verify application works across different browsers.

- [ ] **Test in Chrome/Edge**:

  - [ ] All features work correctly
  - [ ] UI displays properly
  - [ ] No console errors

- [ ] **Test in Firefox**:

  - [ ] All features work correctly
  - [ ] UI displays properly
  - [ ] No console errors

- [ ] **Test in Safari** (if on Mac):
  - [ ] All features work correctly
  - [ ] UI displays properly
  - [ ] No console errors

---

### Step 11.2: Responsive Design Testing

**Objective**: Verify application works on different screen sizes.

- [ ] **Test Mobile View** (use browser dev tools):

  - [ ] Resize to mobile width (375px)
  - [ ] Verify navigation works
  - [ ] Verify forms are usable
  - [ ] Verify newsletter cards display correctly
  - [ ] Verify PDF viewer works on mobile

- [ ] **Test Tablet View**:

  - [ ] Resize to tablet width (768px)
  - [ ] Verify layout adapts correctly
  - [ ] Verify all features are accessible

- [ ] **Test Desktop View**:
  - [ ] Verify layout uses available space
  - [ ] Verify grid layouts work correctly

---

## Part 12: Data Integrity & GDPR

### Step 12.1: Test Data Export (if implemented)

**Objective**: Verify user data can be exported for GDPR compliance.

- [ ] **Export User Data**:

  - As admin, find export function (if in UI) or use AWS CLI
  - Export data for test user
  - **Expected**: Should generate JSON export

- [ ] **Verify Export Contents**:
  - [ ] Export should include:
    - User account information
    - Registration details
    - Recipient information (if linked)
    - Access code usage
    - Newsletter access history (if tracked)

---

### Step 12.2: Test User Deletion

**Objective**: Verify users can be deleted and data is properly cleaned up.

- [ ] **Delete Test User** (as admin):

  - Go to user management (if UI exists) or use AWS CLI
  - Delete test user created in Step 6.1
  - **Expected**: User should be removed

- [ ] **Verify Data Cleanup**:
  - [ ] NewsletterUser record should be deleted or marked as deleted
  - [ ] Access code should remain marked as "used" (historical record)
  - [ ] Verify no orphaned data remains

---

## Part 13: Final Comprehensive Test

### Step 13.1: End-to-End User Journey

**Objective**: Test complete user journey from invitation to newsletter viewing.

- [ ] **Complete Flow**:

  1. [ ] Admin creates recipient
  2. [ ] Admin generates access code
  3. [ ] Admin uploads newsletter
  4. [ ] New user receives invitation link
  5. [ ] User visits registration page with code
  6. [ ] User registers successfully
  7. [ ] User verifies email
  8. [ ] User logs in
  9. [ ] User views newsletter list
  10. [ ] User views newsletter PDF
  11. [ ] User downloads newsletter
  12. [ ] User views card images (if available)

- [ ] **Verify All Steps Work**:
  - [ ] No errors at any step
  - [ ] All data is correctly linked
  - [ ] User experience is smooth

---

### Step 13.2: Admin Workflow Test

**Objective**: Test complete admin workflow.

- [ ] **Complete Admin Flow**:

  1. [ ] Admin logs in
  2. [ ] Admin imports recipients from CSV
  3. [ ] Admin verifies address validation works
  4. [ ] Admin generates access codes for all recipients
  5. [ ] Admin uploads newsletter with PDF and cards
  6. [ ] Admin verifies newsletter appears in list
  7. [ ] Admin edits recipient information
  8. [ ] Admin views newsletter statistics (if available)

- [ ] **Verify All Steps Work**:
  - [ ] No errors at any step
  - [ ] All operations complete successfully
  - [ ] Data is consistent across all operations

---

## Test Data Files

Use the sample files in `samples/2024 YIR/`:

- `KellishFamily2024YIRNewsletter.pdf` - For newsletter upload testing
- `2024CardFront.png` - For card front upload
- `2024CardBack.png` - For card back upload

---

## Common Issues & Solutions

### Issue: "Cannot load newsletters"

**Solution**: Check that:

- Backend sandbox is running
- User is authenticated
- Newsletter authorization allows authenticated users
- S3 bucket permissions are correct

### Issue: "Access code not found"

**Solution**: Check that:

- Code format is correct (KEL-XXXX-XXXX)
- Code exists in database
- Code is not expired
- Code is not already used

### Issue: "Address validation stuck on 'queued'"

**Solution**: Check that:

- SQS queue is processing messages
- Lambda function is running
- SSM parameters are created correctly
- Check CloudWatch logs for errors

### Issue: "Cannot upload newsletter"

**Solution**: Check that:

- File size is within limits
- File type is correct (PDF for newsletter, PNG/JPEG for cards)
- S3 bucket permissions are correct
- Network connection is stable

### Issue: "SSM Parameter not found"

**Solution**:

- Create SSM parameters (see Step 1.2)
- Verify parameter names match exactly
- Check IAM permissions for Lambda functions

---

## Quick Reference: Test User Creation

### Option 1: Via Registration Flow (Recommended for Testing)

1. Create recipient with access code (as admin)
2. Use registration flow to create viewer user
3. Complete email verification
4. User can now login and test viewer features

### Option 2: Via AWS CLI (For Admin/Inviter Users)

```bash
# Set variables
USER_POOL_ID="us-east-1_XXXXXXXXX"
USER_EMAIL="testuser@example.com"
USER_PASSWORD="Test123!@#"

# Create user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $USER_EMAIL \
  --user-attributes Name=email,Value=$USER_EMAIL Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --temporary-password $USER_PASSWORD \
  --profile softsys \
  --region us-east-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username $USER_EMAIL \
  --password $USER_PASSWORD \
  --permanent \
  --profile softsys \
  --region us-east-1

# Add to Admin group (if needed)
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username $USER_EMAIL \
  --group-name Admin \
  --profile softsys \
  --region us-east-1
```

---

## Testing Checklist Summary

Use this checklist to track your progress:

- [ ] Part 1: Initial Deployment & Setup
- [ ] Part 2: First Access & Authentication Testing
- [ ] Part 3: Admin Setup - Recipient Management
- [ ] Part 4: Access Code Generation & Management
- [ ] Part 5: Newsletter Management
- [ ] Part 6: User Registration Flow
- [ ] Part 7: Viewer Access - Newsletter Viewing
- [ ] Part 8: Advanced Admin Features
- [ ] Part 9: Edge Cases & Error Handling
- [ ] Part 10: Performance & Security Testing
- [ ] Part 11: Cross-Browser & Responsive Testing
- [ ] Part 12: Data Integrity & GDPR
- [ ] Part 13: Final Comprehensive Test

---

_Last Updated: 2025-01-XX_
_Guide Version: 2.0 - Sequential Testing Approach_
