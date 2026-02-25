package com.fraudshield.gateway.api_gateway.filter;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtAuthFilter implements HandlerInterceptor {

    @Value("${jwt.secret}")
    private String secret;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler){


       if (request.getRequestURI().equals("/api/auth/login")
               || request.getRequestURI().equals("/api/auth/register") ) {
           System.out.println("URI: " + request.getRequestURI());
           return true;
       }

       if (request.getHeader("Authorization") == null || !request.getHeader("Authorization").startsWith("Bearer ")) {
           response.setStatus(401);
           return false;
       }

        String jwtToken = request.getHeader("Authorization").substring(7);

       try {
           JWT.require(Algorithm.HMAC256(secret)).build().verify(jwtToken);

       } catch (JWTVerificationException e) {

        response.setStatus(401);
           return false;



       }

       return true;


    }
}
