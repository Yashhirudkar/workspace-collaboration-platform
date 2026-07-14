/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "sequelize",
    "pg",
    "pg-hstore",
    "bcrypt"
  ]
};

export default nextConfig;