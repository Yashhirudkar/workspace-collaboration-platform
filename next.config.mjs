/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sequelize', 'pg', 'pg-hstore', 'bcrypt'],
  }
};

export default nextConfig;
