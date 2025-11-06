# Nginx Proxy Manager Configuration Guide

This guide explains how to properly configure Nginx Proxy Manager (NPM) as a reverse proxy for Tidarr to ensure real-time updates work correctly.

## Table of Contents

- [The Problem](#the-problem)
- [Understanding the Issue](#understanding-the-issue)
- [Solution](#solution)
- [Step-by-Step Configuration](#step-by-step-configuration)
- [Troubleshooting](#troubleshooting)

---

## The Problem

When accessing Tidarr through Nginx Proxy Manager (HTTPS reverse proxy), you may experience:

- Downloads appear to not start or hang
- No real-time progress updates in the UI
- Processing queue doesn't update automatically
- Terminal output window remains empty

However, accessing Tidarr directly via IP address (e.g., `http://192.168.1.100:8484`) works perfectly with real-time updates.

---

## Understanding the Issue

### SSE vs WebSockets

**Important:** Tidarr uses **Server-Sent Events (SSE)**, not WebSockets, for real-time updates.

- Enabling "WebSocket Support" in Nginx Proxy Manager **will not fix this issue**
- The problem is caused by Nginx buffering SSE responses instead of streaming them

### How Tidarr Uses SSE

Tidarr has two SSE endpoints:

1. **`/api/stream`** - Broadcasts processing queue updates to all connected clients
2. **`/api/stream_item_output/:id`** - Sends real-time download output logs to the terminal dialog

Both endpoints require special Nginx configuration to work through a reverse proxy.

---

## Solution

You need to configure Nginx Proxy Manager to **disable buffering** and **allow long-lived connections** for SSE endpoints.

### Required Nginx Directives

```nginx
# Disable buffering for SSE
proxy_buffering off;
proxy_cache off;

# Allow long-lived connections (24 hours)
proxy_read_timeout 86400s;

# Ensure proper SSE streaming
chunked_transfer_encoding off;

# Remove interfering headers
proxy_set_header Connection '';
```

---

## Step-by-Step Configuration

### 1. Access Nginx Proxy Manager

Log in to your Nginx Proxy Manager web interface (usually at `http://your-server:81`).

### 2. Create or Edit Proxy Host

1. Go to **Hosts** → **Proxy Hosts**
2. Click **Add Proxy Host** (or edit existing Tidarr proxy)
3. Fill in the **Details** tab:
   - **Domain Names:** `tidarr.yourdomain.com`
   - **Scheme:** `http`
   - **Forward Hostname / IP:** `tidarr` (or your Tidarr container name/IP)
   - **Forward Port:** `8484`
   - **Cache Assets:** OFF
   - **Block Common Exploits:** ON
   - **WebSocket Support:** OFF (not needed for SSE)

### 3. Configure SSL (Optional but Recommended)

1. Go to the **SSL** tab
2. Select your SSL certificate or use **Request a new SSL Certificate**
3. Enable **Force SSL** if desired

### 4. Add Advanced Configuration

1. Go to the **Advanced** tab
2. Add the following configuration:

```nginx
# SSE configuration for /api/stream endpoint
location /api/stream {
    proxy_pass http://tidarr:8484;

    # Disable buffering for SSE
    proxy_buffering off;
    proxy_cache off;

    # Allow long-lived connections
    proxy_read_timeout 86400s;

    # Ensure proper SSE streaming
    chunked_transfer_encoding off;

    # Remove interfering headers
    proxy_set_header Connection '';

    # Forward necessary headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# SSE configuration for /api/stream_item_output endpoint
location /api/stream_item_output {
    proxy_pass http://tidarr:8484;

    # Disable buffering for SSE
    proxy_buffering off;
    proxy_cache off;

    # Allow long-lived connections
    proxy_read_timeout 86400s;

    # Ensure proper SSE streaming
    chunked_transfer_encoding off;

    # Remove interfering headers
    proxy_set_header Connection '';

    # Forward necessary headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Note:** Replace `tidarr:8484` with your actual Tidarr hostname/IP and port if different.

### 5. Save and Test

1. Click **Save**
2. Wait for Nginx to reload (usually a few seconds)
3. Access Tidarr via your domain (e.g., `https://tidarr.yourdomain.com`)
4. Add a download and verify that:
   - Processing queue updates in real-time
   - Progress bars update automatically
   - Terminal output shows download logs

---

## Troubleshooting

### Still Not Working?

**1. Check Nginx Proxy Manager Logs**

Access your NPM container logs:

```bash
docker logs nginx-proxy-manager
```

Look for any errors related to your proxy host configuration.

**2. Verify Tidarr is Accessible Directly**

Test that Tidarr works when accessed directly:

```bash
curl http://tidarr:8484/api/check
```

**3. Test SSE Endpoint Directly**

Open your browser's developer console (F12) and check the **Network** tab:

1. Filter by "stream"
2. Start a download
3. You should see active connections to `/api/stream` and `/api/stream_item_output/:id`
4. Check the response type is `text/event-stream`

**4. Browser Cache**

Clear your browser cache or test in an incognito/private window.

**5. Check Docker Network**

If using Docker Compose, ensure NPM and Tidarr are on the same network or can communicate:

```bash
docker network ls
docker network inspect <network_name>
```

### Common Mistakes

- Enabling "WebSocket Support" in NPM (not needed for SSE)
- Not adding the advanced configuration for `/api/stream*` endpoints
- Using wrong Tidarr hostname/IP in proxy configuration
- Having `proxy_buffering on` (default Nginx behavior)

---

## Configuration Example (Docker Compose)

If you're running both NPM and Tidarr with Docker Compose, ensure they're on the same network:

```yaml
version: '3.8'

services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    ports:
      - "80:80"
      - "81:81"
      - "443:443"
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
    networks:
      - proxy_network

  tidarr:
    image: ghcr.io/cstaelen/tidarr:latest
    container_name: tidarr
    environment:
      - ADMIN_PASSWORD=your_password
      - PUID=1000
      - PGID=1000
    volumes:
      - ./shared:/app/shared
      - ./library:/library
      - ./incomplete:/incomplete
    networks:
      - proxy_network

networks:
  proxy_network:
    driver: bridge

volumes:
  npm_data:
  npm_letsencrypt:
```

In this setup, use `http://tidarr:8484` as the forward address in NPM.

---

## Additional Resources

- [Nginx SSE Documentation](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering)
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Tidarr GitHub Issues](https://github.com/cstaelen/tidarr/issues)

---

## Credits

This guide is based on the solution found in [Issue #425](https://github.com/cstaelen/tidarr/issues/425).

Thanks to the community for identifying and solving this issue!
