import { google } from 'googleapis'
import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'

// Load env vars
try {
  require('dotenv').config({ path: '.env.local' })
} catch {
  // dotenv not installed
}

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local')
    process.exit(1)
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob'
  )

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })

  console.log('\n🔗 Open this URL in your browser to authorize Google Calendar:\n')
  console.log(authUrl)
  console.log('\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question('📋 Paste the authorization code here: ', async (code) => {
    rl.close()

    try {
      const { tokens } = await oauth2Client.getToken(code)
      const refreshToken = tokens.refresh_token

      if (!refreshToken) {
        console.error('❌ No refresh token received. Try revoking access at https://myaccount.google.com/permissions and run again.')
        process.exit(1)
      }

      console.log('\n✅ Authorization successful!')
      console.log(`\n📝 Add this to your .env.local file:\n`)
      console.log(`GOOGLE_REFRESH_TOKEN=${refreshToken}`)

      // Also update .env.local if it exists
      const envPath = path.join(process.cwd(), '.env.local')
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf-8')
        if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(
            /GOOGLE_REFRESH_TOKEN=.*/,
            `GOOGLE_REFRESH_TOKEN=${refreshToken}`
          )
        } else {
          envContent += `\nGOOGLE_REFRESH_TOKEN=${refreshToken}\n`
        }
        fs.writeFileSync(envPath, envContent)
        console.log('\n✅ .env.local updated automatically!')
      }

      console.log('\n🚀 Restart your dev server to apply the changes.')
    } catch (error) {
      console.error('❌ Failed to exchange authorization code:', error)
      process.exit(1)
    }
  })
}

main()
