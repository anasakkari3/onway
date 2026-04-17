import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";
import { createHash, type BinaryLike, type BinaryToTextEncoding } from "node:crypto";

class SafeSha256Hash {
  private readonly hash = createHash("sha256");

  update(data: BinaryLike | undefined, inputEncoding?: BufferEncoding) {
    if (data !== undefined) {
      if (typeof data === "string") {
        if (inputEncoding) {
          this.hash.update(data, inputEncoding);
        } else {
          this.hash.update(data);
        }
      } else {
        this.hash.update(data);
      }
    }

    return this;
  }

  digest(encoding?: BinaryToTextEncoding) {
    return encoding ? this.hash.digest(encoding) : this.hash.digest();
  }
}

const nextConfig: NextConfig = {
  turbopack: {},
  webpack(config) {
    // The webpack PWA build can receive undefined chunk data on Windows with
    // Next 16. Keep hashing deterministic without letting that crash builds.
    config.output = config.output || {};
    config.output.hashFunction = SafeSha256Hash;
    config.optimization = config.optimization || {};
    config.optimization.realContentHash = false;
    return config;
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
})(nextConfig);
