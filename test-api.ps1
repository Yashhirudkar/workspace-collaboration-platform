# =====================================================
# REAL API TEST RUNNER - Local-First Document Editor
# Run this in your PowerShell terminal while npm run dev is active
# =====================================================

$BASE = "http://localhost:3000/api"
$pass = 0
$fail = 0
$results = @()

function Test-API {
    param($name, $method, $url, $body, $headers, $expectedStatus, $note = "")
    try {
        $params = @{ Uri = $url; Method = $method; ErrorAction = "Stop" }
        if ($body)    { $params["Body"]        = $body }
        if ($headers) { $params["Headers"]     = $headers }
        $params["ContentType"] = "application/json"

        $resp = Invoke-RestMethod @params
        $status = 200
        $statusStr = "2xx OK"
        $respJson = $resp | ConvertTo-Json -Depth 5 -Compress
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if (-not $status) { $status = 0 }
        $statusStr = "$status"
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $respJson = $reader.ReadToEnd()
        } catch { $respJson = $_.Exception.Message }
        $resp = $null
    }

    $passed = ($status -ge $expectedStatus[0]) -and ($status -le $expectedStatus[1])
    if ($passed) { $script:pass++ } else { $script:fail++ }

    $result = [PSCustomObject]@{
        Test     = $name
        Method   = $method
        Status   = $statusStr
        Expected = "$($expectedStatus[0])-$($expectedStatus[1])"
        Result   = if ($passed) { "PASS" } else { "FAIL" }
        Body     = ($respJson -replace "`n","" -replace "`r","").Substring(0, [Math]::Min(200, ($respJson -replace "`n","").Length))
        Note     = $note
    }
    $script:results += $result
    Write-Host "[$($result.Result)] $name  (HTTP $status)"
    return $resp
}

Write-Host "`n===== STARTING QA TEST RUN =====" -ForegroundColor Cyan
Write-Host "Target: $BASE`n"

# =====================================================
# 1. HEALTH
# =====================================================
Write-Host "`n--- HEALTH ---" -ForegroundColor Yellow
Test-API "GET /health" "GET" "$BASE/health" $null $null @(200,200)

# =====================================================
# 2. AUTH - SIGNUP
# =====================================================
Write-Host "`n--- AUTH: SIGNUP ---" -ForegroundColor Yellow
$email = "qatest_$(Get-Random)@example.com"

Test-API "Signup - Valid"         "POST" "$BASE/auth/signup" "{`"email`":`"$email`",`"password`":`"Password123!`",`"name`":`"QA Tester`"}" $null @(200,201) "Creates new user"
Test-API "Signup - Dup Email"     "POST" "$BASE/auth/signup" "{`"email`":`"$email`",`"password`":`"Password123!`",`"name`":`"QA Tester`"}" $null @(409,409) "Duplicate should 409"
Test-API "Signup - Missing Email" "POST" "$BASE/auth/signup" "{`"password`":`"Password123!`",`"name`":`"QA`"}" $null @(400,400) "No email = 400"
Test-API "Signup - Empty String"  "POST" "$BASE/auth/signup" "{`"email`":`"`",`"password`":`"Password123!`",`"name`":`"QA`"}" $null @(400,400) "Empty email = 400"
Test-API "Signup - Short Pass"    "POST" "$BASE/auth/signup" "{`"email`":`"short@x.com`",`"password`":`"123`",`"name`":`"QA`"}" $null @(400,400) "Short password = 400"
Test-API "Signup - XSS Title"     "POST" "$BASE/auth/signup" "{`"email`":`"xss@x.com`",`"password`":`"Password123!`",`"name`":`"<script>alert(1)</script>`"}" $null @(400,400) "XSS rejected = 400"
Test-API "Signup - SQL Inject"    "POST" "$BASE/auth/signup" "{`"email`":`"' OR 1=1--@x.com`",`"password`":`"Password123!`",`"name`":`"SQLi`"}" $null @(400,409) "SQLi rejected or 409"
Test-API "Signup - No Body"       "POST" "$BASE/auth/signup" "{}" $null @(400,400) "Empty body = 400"
Test-API "Signup - Missing JWT"   "GET"  "$BASE/auth/signup" $null $null @(400,405) "GET not allowed"

# =====================================================
# 3. AUTH - LOGIN
# =====================================================
Write-Host "`n--- AUTH: LOGIN ---" -ForegroundColor Yellow
$loginResp = Test-API "Login - Valid"         "POST" "$BASE/auth/login" "{`"email`":`"$email`",`"password`":`"Password123!`"}" $null @(200,200) "Returns JWT"
$TOKEN = $loginResp.data.token
Write-Host "  >> JWT captured: $($TOKEN.Substring(0,[Math]::Min(40,$TOKEN.Length)))..."

Test-API "Login - Wrong Password" "POST" "$BASE/auth/login" "{`"email`":`"$email`",`"password`":`"WrongPass!`"}" $null @(401,401) "Wrong pass = 401"
Test-API "Login - Wrong Email"    "POST" "$BASE/auth/login" "{`"email`":`"nobody@x.com`",`"password`":`"Password123!`"}" $null @(401,401) "Unknown email = 401"
Test-API "Login - Missing Fields" "POST" "$BASE/auth/login" "{}" $null @(400,400) "Empty body = 400"
Test-API "Login - SQL Inject"     "POST" "$BASE/auth/login" "{`"email`":`"' OR 1=1--`",`"password`":`"x`"}" $null @(400,401) "SQLi = 400 or 401"

$AUTH = @{ Authorization = "Bearer $TOKEN" }
$FAKE_AUTH = @{ Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlIn0.fakesignature" }
$NO_AUTH = @{}

# =====================================================
# 4. DOCUMENTS - CREATE
# =====================================================
Write-Host "`n--- DOCUMENTS: CREATE ---" -ForegroundColor Yellow
$docResp = Test-API "Create Doc - Valid"         "POST" "$BASE/documents" "{`"title`":`"My QA Doc`",`"content`":{}}" $AUTH @(200,201)
$DOC_ID = $docResp.data.id
Write-Host "  >> Document ID: $DOC_ID"

Test-API "Create Doc - No Auth"      "POST" "$BASE/documents" "{`"title`":`"Test`"}" $NO_AUTH @(401,401) "Missing token"
Test-API "Create Doc - Invalid JWT"  "POST" "$BASE/documents" "{`"title`":`"Test`"}" $FAKE_AUTH @(401,401) "Fake token"
Test-API "Create Doc - Empty Title"  "POST" "$BASE/documents" "{`"title`":`"`",`"content`":{}}" $AUTH @(400,400) "Empty title = 400"
Test-API "Create Doc - No Title"     "POST" "$BASE/documents" "{`"content`":{}}" $AUTH @(400,400) "Missing title = 400"
Test-API "Create Doc - Long Title"   "POST" "$BASE/documents" "{`"title`":`"$('A' * 256)`",`"content`":{}}" $AUTH @(400,400) "Title > 255 chars = 400"
Test-API "Create Doc - XSS"          "POST" "$BASE/documents" "{`"title`":`"<script>alert(1)</script>`",`"content`":{}}" $AUTH @(400,400) "XSS rejected = 400"

# =====================================================
# 5. DOCUMENTS - GET ALL
# =====================================================
Write-Host "`n--- DOCUMENTS: GET ALL ---" -ForegroundColor Yellow
Test-API "Get Docs - Valid"      "GET" "$BASE/documents" $null $AUTH @(200,200)
Test-API "Get Docs - No Auth"    "GET" "$BASE/documents" $null $NO_AUTH @(401,401)
Test-API "Get Docs - Fake JWT"   "GET" "$BASE/documents" $null $FAKE_AUTH @(401,401)

# =====================================================
# 6. DOCUMENTS - GET SINGLE
# =====================================================
Write-Host "`n--- DOCUMENTS: GET SINGLE ---" -ForegroundColor Yellow
Test-API "Get Doc - Valid"       "GET" "$BASE/documents/$DOC_ID" $null $AUTH @(200,200)
Test-API "Get Doc - Invalid UUID" "GET" "$BASE/documents/not-a-uuid" $null $AUTH @(400,400) "Invalid UUID = 400"
Test-API "Get Doc - Random UUID" "GET" "$BASE/documents/00000000-0000-0000-0000-000000000000" $null $AUTH @(403,404) "Unknown doc = 403/404"
Test-API "Get Doc - No Auth"     "GET" "$BASE/documents/$DOC_ID" $null $NO_AUTH @(401,401)

# =====================================================
# 7. DOCUMENTS - UPDATE
# =====================================================
Write-Host "`n--- DOCUMENTS: UPDATE ---" -ForegroundColor Yellow
Test-API "Update Doc - Valid"        "PUT" "$BASE/documents/$DOC_ID" "{`"title`":`"Updated Title`"}" $AUTH @(200,200)
Test-API "Update Doc - No Auth"      "PUT" "$BASE/documents/$DOC_ID" "{`"title`":`"x`"}" $NO_AUTH @(401,401)
Test-API "Update Doc - Invalid UUID" "PUT" "$BASE/documents/bad-uuid"  "{`"title`":`"x`"}" $AUTH @(400,400)
Test-API "Update Doc - Empty Title"  "PUT" "$BASE/documents/$DOC_ID" "{`"title`":`"`"}" $AUTH @(400,400) "Empty = 400"

# =====================================================
# 8. SYNC - PUSH
# =====================================================
Write-Host "`n--- SYNC: PUSH ---" -ForegroundColor Yellow
$opId = [System.Guid]::NewGuid().ToString()
$ts   = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$validOp = "{`"operations`":[{`"id`":`"$opId`",`"timestamp`":$ts,`"operationType`":`"UPDATE`",`"payload`":{`"text`":`"Hello`"}}]}"

Test-API "Sync Push - Valid"      "POST" "$BASE/documents/$DOC_ID/sync/push" $validOp $AUTH @(200,200) "Single op"
Test-API "Sync Push - Replay"     "POST" "$BASE/documents/$DOC_ID/sync/push" $validOp $AUTH @(200,200) "Duplicate op ignored"
Test-API "Sync Push - Empty Ops"  "POST" "$BASE/documents/$DOC_ID/sync/push" "{`"operations`":[]}" $AUTH @(200,200) "Empty array ok"
Test-API "Sync Push - No Auth"    "POST" "$BASE/documents/$DOC_ID/sync/push" $validOp $NO_AUTH @(401,401)
Test-API "Sync Push - Bad UUID"   "POST" "$BASE/documents/bad-uuid/sync/push" $validOp $AUTH @(400,400)

# 101 operations (over limit)
$ops = (1..101 | ForEach-Object { "{`"id`":`"$([System.Guid]::NewGuid())`",`"timestamp`":$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()),`"operationType`":`"UPDATE`",`"payload`":{`"t`":`"$_`"}}" }) -join ","
Test-API "Sync Push - 101 Ops"   "POST" "$BASE/documents/$DOC_ID/sync/push" "{`"operations`":[$ops]}" $AUTH @(400,400) "Over 100 = 400"

# =====================================================
# 9. SYNC - PULL
# =====================================================
Write-Host "`n--- SYNC: PULL ---" -ForegroundColor Yellow
Test-API "Sync Pull - Valid"      "GET" "$BASE/documents/$DOC_ID/sync/pull?since=0" $null $AUTH @(200,200)
Test-API "Sync Pull - No Since"   "GET" "$BASE/documents/$DOC_ID/sync/pull" $null $AUTH @(200,200) "since defaults 0"
Test-API "Sync Pull - Bad Since"  "GET" "$BASE/documents/$DOC_ID/sync/pull?since=invalid" $null $AUTH @(400,400) "NaN = 400"
Test-API "Sync Pull - No Auth"    "GET" "$BASE/documents/$DOC_ID/sync/pull?since=0" $null $NO_AUTH @(401,401)

# =====================================================
# 10. VERSIONS
# =====================================================
Write-Host "`n--- VERSIONS ---" -ForegroundColor Yellow
$verResp = Test-API "Create Version - Valid"  "POST" "$BASE/documents/$DOC_ID/versions" $null $AUTH @(200,201)
$VER_ID = $verResp.data.id
Write-Host "  >> Version ID: $VER_ID"

Test-API "List Versions - Valid"  "GET"  "$BASE/documents/$DOC_ID/versions" $null $AUTH @(200,200)
Test-API "List Versions - No Auth" "GET"  "$BASE/documents/$DOC_ID/versions" $null $NO_AUTH @(401,401)
Test-API "Create Version - No Auth" "POST" "$BASE/documents/$DOC_ID/versions" $null $NO_AUTH @(401,401)

# =====================================================
# 11. RESTORE VERSION
# =====================================================
Write-Host "`n--- RESTORE VERSION ---" -ForegroundColor Yellow
Test-API "Restore - Valid"        "POST" "$BASE/documents/$DOC_ID/versions/$VER_ID" $null $AUTH @(200,200)
Test-API "Restore - Invalid UUID" "POST" "$BASE/documents/$DOC_ID/versions/bad-uuid" $null $AUTH @(400,400)
Test-API "Restore - Random UUID"  "POST" "$BASE/documents/$DOC_ID/versions/00000000-0000-0000-0000-000000000000" $null $AUTH @(404,404)
Test-API "Restore - No Auth"      "POST" "$BASE/documents/$DOC_ID/versions/$VER_ID" $null $NO_AUTH @(401,401)

# =====================================================
# 12. DELETE DOCUMENT
# =====================================================
Write-Host "`n--- DOCUMENTS: DELETE ---" -ForegroundColor Yellow
Test-API "Delete Doc - No Auth"  "DELETE" "$BASE/documents/$DOC_ID" $null $NO_AUTH @(401,401)
Test-API "Delete Doc - Bad UUID" "DELETE" "$BASE/documents/bad-uuid"  $null $AUTH @(400,400)
Test-API "Delete Doc - Valid"    "DELETE" "$BASE/documents/$DOC_ID" $null $AUTH @(200,200)
Test-API "Delete Doc - Again"    "DELETE" "$BASE/documents/$DOC_ID" $null $AUTH @(403,404) "Already deleted"

# =====================================================
# SUMMARY
# =====================================================
Write-Host "`n===== QA TEST RESULTS =====" -ForegroundColor Cyan
$results | Format-Table Test,Method,Status,Expected,Result,Note -AutoSize
Write-Host "TOTAL : $($pass+$fail)" -ForegroundColor White
Write-Host "PASSED: $pass" -ForegroundColor Green
Write-Host "FAILED: $fail" -ForegroundColor Red
Write-Host ""
if ($fail -gt 0) {
    Write-Host "FAILED TESTS:" -ForegroundColor Red
    $results | Where-Object { $_.Result -eq "FAIL" } | Format-Table -AutoSize
}
