import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink, emailOTP } from 'better-auth/plugins';
import { getDb } from './db.js';
import { mailFrom, mailSend } from './mail.js';
import { siteConfig } from '../components/config.js';

const html = ({ url, token }) => `
  <body style="margin: 0; padding: 0; background-color: #efefef;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0;">
      <tr>
        <td align="center" style="padding: 1rem 2rem;">
          <div style="padding: 1rem; background-color: #ffffff; text-align: center;">
            <h1 style="margin: 1rem 0 0 0; color: #000000;">Sign in to</h1>
            <h2 style="margin: 0 0 1rem 0; color: #000000;">${siteConfig.name}</h2>
            <div style="margin: 1rem 0;">
              <p>Click the link below to sign in.</p>
              <p>
                <a href="${url}" target="_blank" style="padding: 0.75rem 1.25rem; border-radius: 0.25rem; color: #FFF; background: #4f46e5; display: inline-block; margin: 0.5rem 0; text-decoration: none;">
                  Sign in to your account
                </a>
              </p>
            </div>
            <p>- OR -</p>
            <div style="margin: 1rem 0;">
              <p>Use this code to sign in:</p>
              <div style="font-size: 1.5rem; font-weight: bold; letter-spacing: 0.5rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem;">
                ${token}
              </div>
            </div>
            <p>If you didn't ask to sign in, please ignore this email.</p>
            <p>Thanks,<br>${siteConfig.from}</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
`;

const text = ({ url, token }) =>
  `Sign in to ${siteConfig.from}\n\nCopy and paste this link into your browser:\n${url}\n\nOr use this code to sign in: ${token}\n\nIf you didn't ask to sign in, you can ignore this email.\n\nThanks,\n${siteConfig.from}`;

export const ipResolution = {
  ipAddressHeaders: ['x-forwarded-for', 'cf-connecting-ip'],
  // Loopback and the private ranges: every hop between the tunnel and the container is our own.
  trustedProxies: ['127.0.0.1/32', '::1/128', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'fc00::/7'],
};

let instance = null;

export function getAuth() {
  instance ??= betterAuth({
    appName: siteConfig.name,
    baseURL: siteConfig.url,
    secret: process.env.AUTH_SECRET,
    database: getDb(),
    emailAndPassword: {
      enabled: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      updateAge: 60 * 60 * 24,
    },
    plugins: [
      magicLink({
        expiresIn: 2 * 60 * 60,
        sendMagicLink: async ({ email, url }) => {
          // The one-time code is minted here so a single email carries both ways in, which is
          // why emailOTP's own sender below is intentionally silent.
          const otp = await getAuth().api.createVerificationOTP({
            body: { email, type: 'sign-in' },
          });

          await mailSend({
            from: `${siteConfig.from} <${mailFrom}>`,
            to: email,
            subject: `Sign in to ${siteConfig.name}`,
            html: html({ url, token: otp }),
            text: text({ url, token: otp }),
          });
        },
      }),
      emailOTP({
        expiresIn: 20 * 60,
        // Deliberately sends nothing: the code travels inside the magic-link email above.
        // Anything that requests a code without going through sendMagicLink gets silence.
        async sendVerificationOTP() {},
      }),
      // Must stay last: plugins with `after` hooks that run past it can set cookies which
      // never reach Next's cookie store, which would silently break sign-in.
      nextCookies(),
    ],
    advanced: {
      cookiePrefix: siteConfig.cookiePrefix,
      ipAddress: ipResolution,
    },
      logger: {
        level: 'warn',
      },
  });

  return instance;
}
