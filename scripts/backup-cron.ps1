# Script de respaldo programado para el Programador de Tareas de Windows (Task Scheduler)
# Programar para ejecutarse diariamente (ej. 02:00 AM)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Split-Path -Parent $ScriptDir

Set-Location $ProjectDir

Write-Host "Iniciando respaldo de base de datos Botigest..." -ForegroundColor Cyan
npx tsx scripts/backup-database.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "Respaldo completado satisfactoriamente." -ForegroundColor Green
} else {
    Write-Host "Fallo en la generacion del respaldo." -ForegroundColor Red
}
