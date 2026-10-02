# Ollama Benchmark Script
# 테스트할 모델명을 실제 설치된 이름에 맞게 수정하세요.

$models = @(
    "qwen2.5-coder:7b",
    "qwen2.5-coder:14b"
)

$prompt = @"
Write a Python function that:
1. Reads a JSON file
2. Sorts records by date
3. Removes duplicates
4. Saves the result to another JSON file
5. Includes error handling

Explain the code briefly.
"@

$runs = 3

$allResults = @()

foreach ($model in $models) {

    Write-Host ""
    Write-Host "========================================="
    Write-Host "Testing model: $model"
    Write-Host "========================================="

    for ($i = 1; $i -le $runs; $i++) {

        Write-Host ""
        Write-Host "Run $i / $runs ..."

        $body = @{
            model  = $model
            prompt = $prompt
            stream = $false
            options = @{
                temperature = 0
            }
        } | ConvertTo-Json -Depth 5

        $result = Invoke-RestMethod `
            -Uri "http://localhost:11434/api/generate" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body

        $evalSeconds = $result.eval_duration / 1000000000
        $promptSeconds = $result.prompt_eval_duration / 1000000000
        $totalSeconds = $result.total_duration / 1000000000
        $loadSeconds = $result.load_duration / 1000000000

        if ($evalSeconds -gt 0) {
            $tokensPerSecond = $result.eval_count / $evalSeconds
        }
        else {
            $tokensPerSecond = 0
        }

        $row = [PSCustomObject]@{
            Model             = $model
            Run               = $i
            PromptTokens      = $result.prompt_eval_count
            OutputTokens      = $result.eval_count
            PromptSeconds     = [math]::Round($promptSeconds, 2)
            GenerationSeconds = [math]::Round($evalSeconds, 2)
            TokensPerSecond   = [math]::Round($tokensPerSecond, 2)
            LoadSeconds       = [math]::Round($loadSeconds, 2)
            TotalSeconds      = [math]::Round($totalSeconds, 2)
        }

        $allResults += $row

        $row | Format-Table -AutoSize
    }
}

Write-Host ""
Write-Host "========================================="
Write-Host "Average Results"
Write-Host "========================================="

$averages = $allResults |
    Group-Object Model |
    ForEach-Object {

        $group = $_.Group

        [PSCustomObject]@{
            Model = $_.Name

            AvgTokensPerSecond = [math]::Round(
                ($group | Measure-Object TokensPerSecond -Average).Average,
                2
            )

            AvgGenerationSeconds = [math]::Round(
                ($group | Measure-Object GenerationSeconds -Average).Average,
                2
            )

            AvgTotalSeconds = [math]::Round(
                ($group | Measure-Object TotalSeconds -Average).Average,
                2
            )

            AvgOutputTokens = [math]::Round(
                ($group | Measure-Object OutputTokens -Average).Average,
                0
            )
        }
    }

$averages | Format-Table -AutoSize

Write-Host ""
Write-Host "========================================="
Write-Host "Detailed Results"
Write-Host "========================================="

$allResults | Format-Table -AutoSize