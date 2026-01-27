<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BurialRecord;
use App\Models\QrCode;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QrCodeController extends Controller
{
    /**
     * Generate QR code for a burial record
     * 
     * @param int $burialId
     * @return \Illuminate\Http\JsonResponse
     */
    public function generate($burialId)
    {
        $burialRecord = BurialRecord::find($burialId);

        if (!$burialRecord) {
            return $this->errorResponse('Burial record not found', 404);
        }

        // Check if QR code already exists
        if ($burialRecord->qrCode) {
            return $this->successResponse([
                'qr_code' => $burialRecord->qrCode,
                'qr_url' => $this->generateQrImageUrl($burialRecord->qrCode->code),
            ], 'QR code already exists');
        }

        // Generate unique code
        $code = Str::uuid()->toString();
        $publicUrl = config('app.frontend_url', 'http://localhost:3000') . '/grave/' . $code;

        // Create QR code record
        $qrCode = QrCode::create([
            'burial_record_id' => $burialId,
            'code' => $code,
            'url' => $publicUrl,
            'is_active' => true,
        ]);

        return $this->successResponse([
            'qr_code' => $qrCode,
            'qr_url' => $this->generateQrImageUrl($code),
        ], 'QR code generated successfully', 201);
    }

    /**
     * Get QR code details
     * 
     * @param string $code
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($code)
    {
        $qrCode = QrCode::with('burialRecord.plot')->where('code', $code)->first();

        if (!$qrCode) {
            return $this->errorResponse('QR code not found', 404);
        }

        return $this->successResponse([
            'qr_code' => $qrCode,
            'qr_url' => $this->generateQrImageUrl($code),
        ], 'QR code retrieved successfully');
    }

    /**
     * Deactivate QR code
     * 
     * @param string $code
     * @return \Illuminate\Http\JsonResponse
     */
    public function deactivate($code)
    {
        $qrCode = QrCode::where('code', $code)->first();

        if (!$qrCode) {
            return $this->errorResponse('QR code not found', 404);
        }

        $qrCode->update(['is_active' => false]);

        return $this->successResponse(null, 'QR code deactivated successfully');
    }

    /**
     * Regenerate QR code
     * 
     * @param int $burialId
     * @return \Illuminate\Http\JsonResponse
     */
    public function regenerate($burialId)
    {
        $burialRecord = BurialRecord::find($burialId);

        if (!$burialRecord) {
            return $this->errorResponse('Burial record not found', 404);
        }

        // Delete existing QR code
        if ($burialRecord->qrCode) {
            $burialRecord->qrCode->delete();
        }

        // Generate new code
        $code = Str::uuid()->toString();
        $publicUrl = config('app.frontend_url', 'http://localhost:3000') . '/grave/' . $code;

        $qrCode = QrCode::create([
            'burial_record_id' => $burialId,
            'code' => $code,
            'url' => $publicUrl,
            'is_active' => true,
        ]);

        return $this->successResponse([
            'qr_code' => $qrCode,
            'qr_url' => $this->generateQrImageUrl($code),
        ], 'QR code regenerated successfully');
    }

    /**
     * Generate QR image URL using external service
     * For production, use the simple-qrcode package
     * 
     * @param string $code
     * @return string
     */
    private function generateQrImageUrl($code)
    {
        $publicUrl = config('app.frontend_url', 'http://localhost:3000') . '/grave/' . $code;
        
        // Using QR Server API for prototype
        // In production, use simplesoftwareio/simple-qrcode package
        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($publicUrl);
    }
}
