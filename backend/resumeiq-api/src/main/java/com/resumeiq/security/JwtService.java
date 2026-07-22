package com.resumeiq.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.util.Date;

@Service
public class JwtService {

    // 256-bit key for HMAC-SHA256 signature
    @Value("${app.jwt.secret:defaultSecretKeyWithAtLeast256BitsOfLengthForSigning}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms:3600000}") // 1 hour default
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}") // 7 days default
    private long refreshExpirationMs;

    public String generateToken(String email, String role) {
        return buildToken(email, role, jwtExpirationMs);
    }

    public String generateRefreshToken(String email, String role) {
        return buildToken(email, role, refreshExpirationMs);
    }

    private String buildToken(String email, String role, long expirationMs) {
        try {
            JWSSigner signer = new MACSigner(secretKey.getBytes());
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(email)
                    .issueTime(new Date())
                    .expirationTime(new Date(System.currentTimeMillis() + expirationMs))
                    .claim("role", role)
                    .build();

            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
            signedJWT.sign(signer);
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error signing JWT token", e);
        }
    }

    public String extractEmail(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (ParseException e) {
            throw new RuntimeException("Error parsing JWT token", e);
        }
    }

    public String extractRole(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getStringClaim("role");
        } catch (ParseException e) {
            throw new RuntimeException("Error extracting role from JWT", e);
        }
    }

    public boolean validateToken(String token, String email) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(secretKey.getBytes());
            boolean signatureValid = signedJWT.verify(verifier);
            boolean notExpired = new Date().before(signedJWT.getJWTClaimsSet().getExpirationTime());
            boolean matchesEmail = extractEmail(token).equals(email);
            return signatureValid && notExpired && matchesEmail;
        } catch (ParseException | JOSEException e) {
            return false;
        }
    }
}
