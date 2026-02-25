package com.fraudshield.gateway.api_gateway.config;

import com.fraudshield.gateway.api_gateway.filter.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class GatewayConfig implements WebMvcConfigurer {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    public void addInterceptors(InterceptorRegistry registry){
        registry.addInterceptor(jwtAuthFilter).addPathPatterns("/**");


    }
}
