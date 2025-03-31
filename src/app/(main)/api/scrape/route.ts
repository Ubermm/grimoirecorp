//@ts-nocheck
import { auth } from '@/app/(auth)/auth';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapeQuery {
  url: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { url }: ScrapeQuery = await request.json();

    if (!url) {
      return new Response('Missing URL', { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return new Response('Invalid URL format', { status: 400 });
    }

    // Check if it's an FDA warning letter URL
    if (!url.includes('fda.gov')) {
      return new Response('URL must be from fda.gov domain', { status: 400 });
    }

    // Fetch the content
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Remove unnecessary elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();

    // Extract the main content
    let content = '';
    
    // Try different possible content containers
    const possibleSelectors = [
      '.main-content',
      '#main-content',
      '.content-area',
      'article',
      '.letter-content',
    ];

    for (const selector of possibleSelectors) {
      const element = $(selector);
      if (element.length) {
        // Convert all <br> and </p> tags to newlines before getting text
        element.find('br').replaceWith('\n');
        element.find('p').after('\n');
        
        // Get text content and preserve important whitespace
        content = element.text()
          .split('\n')
          .map(line => line.trim())
          .filter(line => line) // Remove empty lines
          .join('\n');
        break;
      }
    }

    // If no specific container found, get body content
    if (!content) {
      $('body').find('br').replaceWith('\n');
      $('body').find('p').after('\n');
      content = $('body').text()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .join('\n');
    }

    // Final cleanup
    content = content
      .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n{3,}/g, '\n\n') // Replace excessive newlines with double newline
      .trim();

    if (!content) {
      return new Response('Failed to extract content from URL', { status: 400 });
    }

    // Return JSON response with the content
    return Response.json({ 
      content,
      status: 'success'
    });
  } catch (error) {
    console.error('Warning letter scraping error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return new Response('Warning letter not found', { status: 404 });
      }
      if (error.response?.status === 403) {
        return new Response('Access to warning letter forbidden', { status: 403 });
      }
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}

export async function GET(request: Request) {
  return new Response('Method not allowed', { status: 405 });
}