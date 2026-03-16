<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function getProfile(Request $request)
    {
        $email = $request->query('email');

        $profile = DB::table('burial_records')
            ->select(
                'contact_first_name',
                'contact_middle_initial',
                'contact_last_name',
                'contact_phone',
                'contact_email'
            )
            ->where('contact_email', $email)
            ->first();

        return response()->json($profile);
    }
}
