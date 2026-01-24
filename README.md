# PDF to Google Sheets Product Importer

Automatically extract products from PDF catalog and import to Google Sheets.

## Features

- ✅ Reads PDF files using `pdf-parse`
- ✅ Intelligent text extraction and cleaning
- ✅ Removes headers, footers, phone numbers, emails
- ✅ Auto-calculates suggested price (wholesale × 1.4)
- ✅ Auto-calculates affiliate profit
- ✅ Direct Google Sheets API integration
- ✅ Service account authentication
- ✅ Batch import with preview

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Google Cloud Setup

#### Create Service Account:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Sheets API**
4. Go to **IAM & Admin** → **Service Accounts**
5. Create service account
6. Download JSON key file
7. Save as `service-account-key.json` in project root

#### Share Google Sheet:
1. Create a new Google Sheet
2. Copy the Spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
3. Share the sheet with service account email:
   ```
   your-service-account@project-id.iam.gserviceaccount.com
   ```
4. Give **Editor** permission

### 3. Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PDF_FILE_PATH=./catalog.pdf
GOOGLE_CREDENTIALS_PATH=./service-account-key.json
SPREADSHEET_ID=your_actual_spreadsheet_id
SHEET_NAME=Products
DEFAULT_CATEGORY=General
```

### 4. Add Your PDF

Place your PDF catalog in the project folder as `catalog.pdf` or update path in `.env`.

## Usage

Run the import:

```bash
npm run import
```

### What It Does:

1. 📄 Reads PDF file
2. 🔍 Extracts product data
3. 🧹 Cleans text (removes noise)
4. 🏗️ Structures data with calculations
5. 📊 Previews first 3 products
6. ☁️ Writes to Google Sheets

## Google Sheet Format

| name | wholesale_price | suggested_price | affiliate_profit | sku | packaging | category | active |
|------|-----------------|-----------------|------------------|-----|-----------|----------|--------|
| Product A | 300 | 420 | 120 | SKU001 | 10 | General | TRUE |
| Product B | 500 | 700 | 200 | SKU002 | 5 | General | TRUE |

## Customization

### Adjust Price Multiplier

In `importProducts.js` line 144:
```js
const suggested = Math.round(wholesale * 1.4 * 100) / 100; // Change 1.4 to your multiplier
```

### Modify Parsing Logic

If your PDF has different format, adjust regex patterns in `parseProducts()` function (lines 80-140):

```js
// SKU pattern
const skuMatch = line.match(/\b([A-Z]{2,4}[-]?\d{4,10}|\d{6,10})\b/);

// Price pattern
const priceMatch = line.match(/(?:prix\s*:?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:DA|DZD|MAD|€)?/i);

// Packaging pattern
const packagingMatch = line.match(/(?:pack|emballage|carton|boîte|qty|quantité)\s*:?\s*(\d+)/i);
```

### Add Category Detection

In `parseProducts()`, add category logic:
```js
if (line.includes('Adaptateur')) {
  currentProduct.category = 'Adaptateurs';
}
```

## Troubleshooting

### No products found
- Check PDF format with `console.log(rawText)` 
- Adjust regex patterns to match your PDF structure
- Verify text is extractable (not scanned images)

### Google Sheets authentication error
- Verify service account JSON is correct
- Confirm sheet is shared with service account email
- Check Google Sheets API is enabled

### Wrong data extracted
- Inspect PDF text structure
- Modify cleaning patterns in `cleanText()`
- Adjust parsing logic in `parseProducts()`

## Dependencies

- `pdf-parse` - PDF text extraction
- `googleapis` - Google Sheets API client
- `dotenv` - Environment configuration

## License

MIT
