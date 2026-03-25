with open('src/frontend/src/App.tsx', 'r') as f:
    content = f.read()

drug_categories_const = '''
const DRUG_CATEGORIES = [
  "এন্টিবায়োটিক (Antibiotic)",
  "এন্টিহিস্টামিন (Antihistamine)",
  "এন্টিফাঙ্গাল (Antifungal)",
  "এন্টি অ্যানালজেসিক / ব্যথানাশক (Analgesic)",
  "এন্টিপাইরেটিক / জ্বরনাশক (Antipyretic)",
  "এন্টাসিড / গ্যাস্ট্রিক (Antacid)",
  "এন্টিডায়াবেটিক (Antidiabetic)",
  "এন্টিহাইপারটেনসিভ / উচ্চ রক্তচাপ (Antihypertensive)",
  "এন্টিআলসার (Antiulcer)",
  "এন্টিডায়ারিয়াল (Antidiarrheal)",
  "এন্টিভোমিটিং / বমিনাশক (Antiemetic)",
  "এন্টিকনভালসেন্ট / খিঁচুনিনাশক (Anticonvulsant)",
  "এন্টিডিপ্রেসেন্ট (Antidepressant)",
  "ভিটামিন ও মিনারেল (Vitamin & Mineral)",
  "আয়রন ও হিমাটিনিক (Iron & Haematinic)",
  "ক্যালসিয়াম সাপ্লিমেন্ট (Calcium Supplement)",
  "ডিওয়ার্মিং / কৃমিনাশক (Anthelmintic)",
  "চর্মরোগের ওষুধ (Dermatological)",
  "চোখের ড্রপ / Eye Drop (Ophthalmic)",
  "নাকের ড্রপ (Nasal Preparation)",
  "ব্রংকোডায়ালেটর / হাঁপানির ওষুধ (Bronchodilator)",
  "কার্ডিওভাসকুলার (Cardiovascular)",
  "হরমোন / Hormonal",
  "থাইরয়েড (Thyroid)",
  "ব্যথার মলম / ক্রিম (Topical Analgesic)",
  "অ্যান্টিসেপটিক (Antiseptic)",
  "ইনজেকশন (Injection/Parenteral)",
  "স্যালাইন ও আইভি ফ্লুইড (IV Fluid/Saline)",
  "অন্যান্য (Other)",
];
'''

# Step 1: Add DRUG_CATEGORIES after EXPENSE_CATEGORIES
old1 = '  "আনলোডিং খরচ",\n];\n\n// ─── Dashboard'
new1 = '  "আনলোডিং খরচ",\n];\n' + drug_categories_const + '// ─── Dashboard'
if old1 in content:
    content = content.replace(old1, new1, 1)
    print('Step 1 OK')
else:
    print('Step 1 FAILED - marker not found')

# Step 2: Add drugCategory state
old2 = '  const [newUnit, setNewUnit] = useState("");\n\n  const suggestions'
new2 = '  const [newUnit, setNewUnit] = useState("");\n  const [drugCategory, setDrugCategory] = useState(DRUG_CATEGORIES[0]);\n\n  const suggestions'
if old2 in content:
    content = content.replace(old2, new2, 1)
    print('Step 2 OK')
else:
    print('Step 2 FAILED')

# Step 3: Reset drugCategory on form submit
old3 = '      setMinStockAlert("10");\n      onRefresh();'
new3 = '      setMinStockAlert("10");\n      setDrugCategory(DRUG_CATEGORIES[0]);\n      onRefresh();'
if old3 in content:
    content = content.replace(old3, new3, 1)
    print('Step 3 OK')
else:
    print('Step 3 FAILED')

# Step 4: Add dropdown UI after "ধরন" Select field block
# The pattern is: after itemType select, before qty/unit
old4 = '            <div>\n              <Label>পরিমাণ ও ইউনিট</Label>'
new4 = '''            <div>
              <Label className="flex items-center gap-1.5" style={{color: "#7c3aed"}}>
                <span>🏷</span> ওষুধের শ্রেণী (Drug Category)
              </Label>
              <Select value={drugCategory} onValueChange={setDrugCategory}>
                <SelectTrigger data-ocid="purchases.drugCategory.select" style={{borderColor: "#7c3aed33"}}>
                  <SelectValue placeholder="শ্রেণী নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {DRUG_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>পরিমাণ ও ইউনিট</Label>'''
if old4 in content:
    content = content.replace(old4, new4, 1)
    print('Step 4 OK')
else:
    print('Step 4 FAILED')

with open('src/frontend/src/App.tsx', 'w') as f:
    f.write(content)

print('All done')
