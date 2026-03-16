<?php

namespace App\Services;

use Illuminate\Validation\Rules\Password;

class ValidationRules
{
    /**
     * Shared strong password policy for all user-managed passwords.
     */
    public static function strongPasswordRule(): Password
    {
        return Password::min(12)
            ->letters()
            ->mixedCase()
            ->numbers()
            ->symbols()
            ->uncompromised();
    }

    /**
     * Detect SQL injection attempts
     */
    private static function containsSqlInjection($input)
    {
        $dangerousPatterns = [
            "/(['\"])|(--)|(\*\/)|(\*)|(\||xp_|sp_|exec|execute|drop|delete|insert|update|select)/i"
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Escape HTML entities to prevent XSS
     */
    public static function escapeHtml($text)
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Sanitize HTML by removing dangerous content
     */
    public static function sanitizeHtml($html)
    {
        $html = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i', '', $html);
        $html = preg_replace('/on\w+\s*=\s*["\'&#39;]?[^"\'&#39;]*["\'&#39;]?/i', '', $html);
        $html = preg_replace('/<iframe[^>]*>.*?<\/iframe>/i', '', $html);
        $html = preg_replace('/javascript:/i', '', $html);
        return $html;
    }

    /**
     * Validate name field (first name, last name, etc.)
     * Prevents SQL injection and XSS attempts
     */
    public static function validateName($name, $fieldName = 'Name', $minLength = 2, $maxLength = 50)
    {
        if (!is_string($name) || empty(trim($name))) {
            return "{$fieldName} is required";
        }

        $trimmed = trim($name);

        // Check for SQL injection attempts
        if (self::containsSqlInjection($trimmed)) {
            return "{$fieldName} contains invalid characters";
        }

        if (strlen($trimmed) < $minLength) {
            return "{$fieldName} must be at least {$minLength} characters";
        }

        if (strlen($trimmed) > $maxLength) {
            return "{$fieldName} cannot exceed {$maxLength} characters";
        }

        // Only allow letters, spaces, hyphens, apostrophes
        if (!preg_match("/^[a-zA-Z\s\-']+$/", $trimmed)) {
            return "{$fieldName} can only contain letters, spaces, hyphens, and apostrophes (no periods, semicolons, or symbols)";
        }

        // No leading/trailing spaces or hyphens
        if ($trimmed !== trim($trimmed) || strpos($trimmed, '-') === 0 || strrpos($trimmed, '-') === strlen($trimmed) - 1) {
            return "{$fieldName} has invalid spacing or characters";
        }

        // No consecutive spaces
        if (strpos($trimmed, '  ') !== false) {
            return "{$fieldName} cannot have consecutive spaces";
        }

        return null; // Valid
    }

    /**
     * Validate email address - RFC 5322 compliant
     */
    public static function validateEmail($email)
    {
        if (!is_string($email) || empty(trim($email))) {
            return 'Email is required';
        }

        $trimmed = strtolower(trim($email));

        // Check for SQL injection
        if (self::containsSqlInjection($trimmed)) {
            return 'Email contains invalid characters';
        }

        if (strlen($trimmed) > 254) {
            return 'Email is too long (max 254 characters)';
        }

        // Enhanced RFC 5322 regex for email validation
        $emailRegex = '/^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/';
        
        if (!preg_match($emailRegex, $trimmed)) {
            return 'Please enter a valid email address';
        }

        // Additional checks
        if (strpos($trimmed, '..') !== false) {
            return 'Email cannot have consecutive dots';
        }

        $parts = explode('@', $trimmed);
        if (strlen($parts[0]) > 64) {
            return 'Email local part is too long';
        }

        if (strpos($parts[0], '.') === 0 || strrpos($parts[0], '.') === strlen($parts[0]) - 1) {
            return 'Invalid email format';
        }

        // Verify domain has at least one dot
        if (!strpos($parts[1], '.')) {
            return 'Invalid email domain';
        }

        return null; // Valid
    }

    /**
     * Validate phone number based on country code
     * Prevents SQL injection
     */
    public static function validatePhone($phone, $countryCode = '+63')
    {
        if (empty($phone)) {
            return null; // Phone is optional
        }

        $phoneStr = (string)$phone;
        
        // Check for SQL injection
        if (self::containsSqlInjection($phoneStr)) {
            return 'Phone number contains invalid characters';
        }

        $phoneRequirements = [
            '+63' => 10,   // Philippines
            '+1' => 10,    // USA/Canada
            '+44' => 10,   // UK
            '+61' => 9,    // Australia
            '+81' => 10,   // Japan
            '+82' => 10,   // South Korea
            '+86' => 11,   // China
            '+65' => 8,    // Singapore
            '+60' => 10,   // Malaysia
            '+971' => 9    // UAE
        ];

        $digitsOnly = preg_replace('/\D/', '', $phoneStr);

        if (empty($digitsOnly)) {
            return null; // Phone is optional
        }

        $requiredDigits = $phoneRequirements[$countryCode] ?? 10;
        $country = self::getCountryName($countryCode);

        if (strlen($digitsOnly) !== $requiredDigits) {
            return "Phone number must be exactly $requiredDigits digits for $country";
        }

        return null; // Valid
    }

    /**
     * Validate password strength
     * Requires: 8+ chars, uppercase, lowercase, number, special char
     */
    public static function validatePassword($password)
    {
        if (!is_string($password)) {
            return 'Password is required';
        }

        if (strlen($password) < 8) {
            return 'Password must be at least 8 characters';
        }

        if (strlen($password) > 128) {
            return 'Password cannot exceed 128 characters';
        }

        if (!preg_match('/[A-Z]/', $password)) {
            return 'Password must contain at least one uppercase letter';
        }

        if (!preg_match('/[a-z]/', $password)) {
            return 'Password must contain at least one lowercase letter';
        }

        if (!preg_match('/[0-9]/', $password)) {
            return 'Password must contain at least one number';
        }

        if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};:"\'\\|,.<>\/?]/', $password)) {
            return 'Password must contain at least one special character (!@#$%^&*etc)';
        }

        return null; // Valid
    }

    /**
     * Validate text area / description field
     * Prevents SQL injection and XSS
     */
    public static function validateTextArea($text, $fieldName = 'Text', $minLength = 1, $maxLength = 5000)
    {
        if (!is_string($text) || empty(trim($text))) {
            return "{$fieldName} is required";
        }

        $trimmed = trim($text);

        // Check for SQL injection patterns
        if (self::containsSqlInjection($trimmed)) {
            return "{$fieldName} contains invalid characters";
        }

        if (strlen($trimmed) < $minLength) {
            return "{$fieldName} must be at least {$minLength} characters";
        }

        if (strlen($trimmed) > $maxLength) {
            return "{$fieldName} cannot exceed {$maxLength} characters";
        }

        // Check for script injection
        if (preg_match('/<script|<iframe|javascript:|on\w+=/i', $trimmed)) {
            return "{$fieldName} contains invalid content";
        }

        return null; // Valid
    }

    /**
     * Validate date format and basic logic
     */
    public static function validateDate($dateString, $fieldName = 'Date')
    {
        if (empty($dateString)) {
            return "{$fieldName} is required";
        }

        $date = \DateTime::createFromFormat('Y-m-d', $dateString);

        if (!$date || $date->format('Y-m-d') !== $dateString) {
            return "{$fieldName} is invalid (format: YYYY-MM-DD)";
        }

        return null; // Valid
    }

    /**
     * Validate birth date
     * Ensures age is between 0 and 150 years
     */
    public static function validateBirthDate($dateString)
    {
        $dateError = self::validateDate($dateString, 'Birth Date');
        if ($dateError) return $dateError;

        $date = new \DateTime($dateString);
        $today = new \DateTime();

        if ($date > $today) {
            return 'Birth date cannot be in the future';
        }

        $age = $today->diff($date)->y;

        if ($age < 0 || $age > 150) {
            return 'Please enter a realistic birth date (age cannot exceed 150 years)';
        }

        return null; // Valid
    }

    /**
     * Validate death date
     * Ensures: birth_date < death_date < today
     */
    public static function validateDeathDate($dateString, $birthDate = null)
    {
        $dateError = self::validateDate($dateString, 'Death Date');
        if ($dateError) return $dateError;

        $deathDate = new \DateTime($dateString);
        $today = new \DateTime();

        if ($deathDate > $today) {
            return 'Death date cannot be in the future';
        }

        if ($birthDate) {
            $birthDateObj = new \DateTime($birthDate);
            if ($deathDate < $birthDateObj) {
                return 'Death date cannot be before birth date';
            }

            // Check if age at death is realistic
            $ageAtDeath = $deathDate->diff($birthDateObj)->y;
            if ($ageAtDeath > 150) {
                return 'Age at death seems unrealistic (exceeds 150 years)';
            }
        }

        return null; // Valid
    }

    /**
     * Validate burial date
     * Ensures: birth_date < death_date < burial_date
     * And burial typically happens within 365 days of death
     */
    public static function validateBurialDate($dateString, $birthDate = null, $deathDate = null)
    {
        $dateError = self::validateDate($dateString, 'Burial Date');
        if ($dateError) return $dateError;

        $burialDate = new \DateTime($dateString);
        $today = new \DateTime();

        if ($burialDate > $today) {
            return 'Burial date cannot be in the future';
        }

        if ($deathDate) {
            $deathDateObj = new \DateTime($deathDate);
            if ($burialDate < $deathDateObj) {
                return 'Burial date cannot be before death date';
            }

            // Check if burial happened within reasonable timeframe
            $daysBetween = $burialDate->diff($deathDateObj)->days;
            if ($daysBetween > 365) {
                return 'Burial date is more than 1 year after death date - please verify';
            }
        }

        if ($birthDate) {
            $birthDateObj = new \DateTime($birthDate);
            if ($burialDate < $birthDateObj) {
                return 'Burial date cannot be before birth date';
            }
        }

        return null; // Valid
    }

    /**
     * Validate number field
     */
    public static function validateNumber($value, $fieldName = 'Number', $min = 0, $max = 9999)
    {
        if ($value === null || $value === '' || !is_numeric($value)) {
            return "{$fieldName} must be a valid number";
        }

        $num = (float)$value;

        if ($num < $min) {
            return "{$fieldName} must be at least $min";
        }

        if ($num > $max) {
            return "{$fieldName} cannot exceed $max";
        }

        return null; // Valid
    }

    /**
     * Validate required field
     */
    public static function validateRequired($value, $fieldName = 'Field')
    {
        if ((is_string($value) && empty(trim($value))) || ($value === null && $value !== 0 && $value !== false)) {
            return "{$fieldName} is required";
        }

        return null; // Valid
    }

    /**
     * Validate plot number
     */
    public static function validatePlotNumber($plotNumber)
    {
        if (!is_string($plotNumber) || empty(trim($plotNumber))) {
            return 'Plot number is required';
        }

        $trimmed = strtoupper(trim($plotNumber));

        if (strlen($trimmed) > 20) {
            return 'Plot number is too long';
        }

        // Allow letters, numbers, hyphens only
        if (!preg_match('/^[A-Z0-9\-]+$/', $trimmed)) {
            return 'Plot number can only contain letters, numbers, and hyphens';
        }

        return null; // Valid
    }

    /**
     * Validate address field
     * Requires minimum 5 characters, prevents SQL injection
     */
    public static function validateAddress($address, $fieldName = 'Address', $minLength = 5, $maxLength = 200)
    {
        if (!is_string($address) || empty(trim($address))) {
            return "{$fieldName} is required";
        }

        $trimmed = trim($address);

        // Check for SQL injection
        if (self::containsSqlInjection($trimmed)) {
            return "{$fieldName} contains invalid characters";
        }

        if (strlen($trimmed) < $minLength) {
            return "{$fieldName} must be at least {$minLength} characters";
        }

        if (strlen($trimmed) > $maxLength) {
            return "{$fieldName} cannot exceed {$maxLength} characters";
        }

        return null; // Valid
    }

    /**
     * Validate file upload
     */
    public static function validateFile($file, $maxSizeMB = 5, $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'])
    {
        if (!$file) {
            return 'File is required';
        }

        $maxSizeBytes = $maxSizeMB * 1024 * 1024;

        if ($file->getSize() > $maxSizeBytes) {
            return "File cannot exceed {$maxSizeMB}MB";
        }

        if (!in_array($file->getMimeType(), $allowedTypes)) {
            return 'File type not allowed. Accepted: ' . implode(', ', $allowedTypes);
        }

        return null; // Valid
    }

    /**
     * Validate URL
     */
    public static function validateUrl($url, $fieldName = 'URL')
    {
        if (empty($url)) {
            return null; // Optional
        }

        // Check for SQL injection in URL
        if (self::containsSqlInjection($url)) {
            return "{$fieldName} contains invalid characters";
        }

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return "{$fieldName} is not a valid URL";
        }

        return null; // Valid
    }

    /**
     * Get country name from country code
     */
    public static function getCountryName($countryCode)
    {
        $countries = [
            '+63' => 'Philippines',
            '+1' => 'USA/Canada',
            '+44' => 'UK',
            '+61' => 'Australia',
            '+81' => 'Japan',
            '+82' => 'South Korea',
            '+86' => 'China',
            '+65' => 'Singapore',
            '+60' => 'Malaysia',
            '+971' => 'UAE'
        ];

        return $countries[$countryCode] ?? 'Selected Country';
    }

    /**
     * Sanitize name for storage - trim and normalize spaces
     */
    public static function sanitizeName($name)
    {
        if (!is_string($name)) return '';
        $trimmed = trim($name);
        $normalized = preg_replace('/\s+/', ' ', $trimmed);
        return substr($normalized, 0, 50); // Max 50 chars
    }

    /**
     * Sanitize email for storage
     */
    public static function sanitizeEmail($email)
    {
        return strtolower(trim($email));
    }

    /**
     * Sanitize text area for storage - removes malicious content
     */
    public static function sanitizeTextArea($text)
    {
        if (!is_string($text)) return '';
        $trimmed = trim($text);
        // Remove script tags and dangerous content
        $sanitized = preg_replace('/<script|<iframe|javascript:|on\w+=/i', '', $trimmed);
        $normalized = preg_replace('/\s+/', ' ', $sanitized);
        return substr($normalized, 0, 5000); // Max 5000 chars
    }

    /**
     * Sanitize address for storage
     */
    public static function sanitizeAddress($address)
    {
        if (!is_string($address)) return '';
        $trimmed = trim($address);
        $normalized = preg_replace('/\s+/', ' ', $trimmed);
        return substr($normalized, 0, 200); // Max 200 chars
    }
}
