/** @type {import('next').NextConfig} */

const domainUrl = new URL('https://resources.tidal.com');

const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [{
      protocol: domainUrl.protocol.split(':')[0],
      hostname: domainUrl.hostname,
      port: domainUrl.port,
      pathname: '/**/*',
    }],
  },
}

module.exports = nextConfig
