/**
 * PulseSync High-Performance Native Healthcare Engine (C++) v2.2
 * Implements ultra-fast geodesic calculations, emergency dispatch optimization,
 * triage severity scoring, and ABO/Rh blood compatibility verification.
 */

#include <cmath>
#include <cstring>
#include <cstdio>
#include <cstdlib>
#include <cctype>
#include <algorithm>
#include <string>
#include <vector>

#define EARTH_RADIUS_KM 6371.0
#define PI 3.14159265358979323846

#ifdef _WIN32
  #define EXPORT extern "C" __declspec(dllexport)
#else
  #define EXPORT extern "C" __attribute__((visibility("default")))
#endif

// Convert degrees to radians
static inline double deg2rad(double deg) {
    return deg * (PI / 180.0);
}

// Normalize blood group strings to uppercase and trim whitespace
static std::string normalize_blood_group(const char* str) {
    if (!str) return "";
    std::string s;
    for (int i = 0; str[i] != '\0'; i++) {
        if (!isspace(str[i])) {
            s += (char)toupper(str[i]);
        }
    }
    return s;
}

// 1. High-Precision Haversine Distance Calculation in Kilometers
EXPORT double calculate_haversine_distance(double lat1, double lon1, double lat2, double lon2) {
    double dLat = deg2rad(lat2 - lat1);
    double dLon = deg2rad(lon2 - lon1);
    
    double a = sin(dLat / 2.0) * sin(dLat / 2.0) +
               cos(deg2rad(lat1)) * cos(deg2rad(lat2)) *
               sin(dLon / 2.0) * sin(dLon / 2.0);
               
    double c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    return EARTH_RADIUS_KM * c;
}

// 2. Estimated Transit Time in Minutes (calibrated for Indian metropolitan & highway traffic)
EXPORT double calculate_eta_minutes(double distance_km, int is_emergency) {
    double avg_speed = is_emergency ? 38.0 : 24.0;
    double hours = distance_km / avg_speed;
    double minutes = hours * 60.0;
    return std::max(2.0, minutes + 2.0); // minimum 2.0 mins dispatch latency
}

// 3. Emergency Triage Severity Scoring (Scale 1 to 100)
EXPORT int calculate_triage_score(int age, int emergency_type, int pulse_rate, int systolic_bp) {
    int score = 0;

    switch (emergency_type) {
        case 1: score += 50; break; // Acute Cardiac / Severe Chest Pain
        case 2: score += 45; break; // Road Accident / Poly-Trauma
        case 3: score += 40; break; // Severe Respiratory Distress / Asthma
        case 4: score += 35; break; // Unconscious / Stroke / Diabetic
        default: score += 20; break; // General Acute Emergency
    }

    if (age >= 65 || age <= 5) score += 15;
    else if (age >= 50) score += 8;

    if (pulse_rate > 0) {
        if (pulse_rate < 45 || pulse_rate > 135) score += 20;
        else if (pulse_rate < 55 || pulse_rate > 110) score += 10;
    }

    if (systolic_bp > 0) {
        if (systolic_bp < 85 || systolic_bp > 190) score += 20;
        else if (systolic_bp < 95 || systolic_bp > 160) score += 10;
    }

    return std::min(100, std::max(1, score));
}

// 4. ABO/Rh Blood Compatibility Matrix
EXPORT int check_blood_compatibility(const char* donor_group_raw, const char* recipient_group_raw) {
    if (!donor_group_raw || !recipient_group_raw) return 0;

    std::string donor = normalize_blood_group(donor_group_raw);
    std::string recipient = normalize_blood_group(recipient_group_raw);

    if (donor.empty() || recipient.empty()) return 0;

    // O- is universal red blood cell donor
    if (donor == "O-") return 1;

    // AB+ is universal red blood cell recipient
    if (recipient == "AB+") return 1;

    // Identical group is always compatible
    if (donor == recipient) return 1;

    // Specific Rh & ABO match rules
    if (recipient == "A+") {
        return (donor == "A-" || donor == "O+");
    }
    if (recipient == "A-") {
        return (donor == "O-");
    }
    if (recipient == "B+") {
        return (donor == "B-" || donor == "O+");
    }
    if (recipient == "B-") {
        return (donor == "O-");
    }
    if (recipient == "AB-") {
        return (donor == "A-" || donor == "B-" || donor == "O-");
    }
    if (recipient == "O+") {
        return (donor == "O-");
    }

    return 0;
}

// 5. Fast Nearest Ambulance Finder
EXPORT int find_optimal_ambulance(
    double caller_lat, double caller_lon,
    int count,
    const double* lats, const double* lons,
    const int* availabilities, const int* als_flags,
    int requires_als,
    double* out_distance, double* out_eta
) {
    if (count <= 0 || !lats || !lons || !availabilities) return -1;

    int best_index = -1;
    double min_eta = 1e9;
    double best_dist = 1e9;

    for (int i = 0; i < count; i++) {
        if (!availabilities[i]) continue;
        if (requires_als && als_flags && !als_flags[i]) continue;

        double dist = calculate_haversine_distance(caller_lat, caller_lon, lats[i], lons[i]);
        double eta = calculate_eta_minutes(dist, 1);

        if (eta < min_eta) {
            min_eta = eta;
            best_dist = dist;
            best_index = i;
        }
    }

    if (out_distance) *out_distance = best_dist;
    if (out_eta) *out_eta = min_eta;

    return best_index;
}

// CLI Interface for Subprocess Execution & Rapid Verification
int main(int argc, char* argv[]) {
    if (argc >= 2) {
        if (strcmp(argv[1], "route") == 0 && argc >= 6) {
            double lat1 = atof(argv[2]);
            double lon1 = atof(argv[3]);
            double lat2 = atof(argv[4]);
            double lon2 = atof(argv[5]);
            double dist = calculate_haversine_distance(lat1, lon1, lat2, lon2);
            double eta = calculate_eta_minutes(dist, 1);
            printf("{\"distance_km\": %.2f, \"eta_mins\": %.1f, \"engine\": \"C++ Native (O3 Compiled)\"}\n", dist, eta);
            return 0;
        }
        else if (strcmp(argv[1], "triage") == 0 && argc >= 6) {
            int age = atoi(argv[2]);
            int type = atoi(argv[3]);
            int pulse = atoi(argv[4]);
            int bp = atoi(argv[5]);
            int score = calculate_triage_score(age, type, pulse, bp);
            printf("{\"triage_score\": %d, \"priority\": \"%s\", \"engine\": \"C++ Native (O3 Compiled)\"}\n",
                   score, (score >= 50 ? "CRITICAL PRIORITY 1" : score >= 35 ? "URGENT PRIORITY 2" : "ROUTINE PRIORITY 3"));
            return 0;
        }
        else if (strcmp(argv[1], "blood") == 0 && argc >= 4) {
            const char* donor = argv[2];
            const char* recip = argv[3];
            int comp = check_blood_compatibility(donor, recip);
            printf("{\"compatible\": %d, \"donor\": \"%s\", \"recipient\": \"%s\", \"engine\": \"C++ Native (O3 Compiled)\"}\n",
                   comp, donor, recip);
            return 0;
        }
    }

    if (argc >= 5) {
        double lat1 = atof(argv[1]);
        double lon1 = atof(argv[2]);
        double lat2 = atof(argv[3]);
        double lon2 = atof(argv[4]);
        double dist = calculate_haversine_distance(lat1, lon1, lat2, lon2);
        double eta = calculate_eta_minutes(dist, 1);
        printf("{\"distance_km\": %.2f, \"eta_mins\": %.1f, \"engine\": \"C++ Native (O3 Compiled)\"}\n", dist, eta);
        return 0;
    }

    printf("{\"status\": \"ready\", \"engine\": \"PulseSync Native C++ Healthcare Engine v2.2\", \"compiler\": \"GCC O3\"}\n");
    return 0;
}
