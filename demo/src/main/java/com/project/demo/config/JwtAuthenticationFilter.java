package com.project.demo.config;

import com.project.demo.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList; // Ta để quyền rỗng vì tạm thời chưa chia role Admin/User
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final Long userId;

        // Nếu không có token hoặc không bắt đầu bằng "Bearer ", cho qua (để SecurityConfig bắt lỗi sau)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7); // Cắt bỏ chữ "Bearer "

        try {
            userId = jwtService.extractUserId(jwt); // Lấy userId ra từ token

            // Nếu có userId và chưa được xác thực trong context hiện tại
            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                if (jwtService.isTokenValid(jwt)) {
                    // Lấy role từ token ra
                    String role = jwtService.extractRole(jwt);

                    // Gắn mác "ROLE_ADMIN" hoặc "ROLE_USER" theo chuẩn của Spring
                    var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            authorities // Đưa danh sách quyền vào đây thay vì new ArrayList<>()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token hết hạn hoặc sai định dạng
        }

        filterChain.doFilter(request, response);
    }
}