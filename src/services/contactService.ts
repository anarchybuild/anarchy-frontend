
import { supabase } from '@/integrations/supabase/client';

export interface ContactSubmission {
  email: string;
  comment: string;
}

export interface ContactSubmissionResult {
  success: boolean;
  error?: string;
}

export const submitContactForm = async (
  submission: ContactSubmission
): Promise<ContactSubmissionResult> => {
  try {
    console.log('Submitting contact form:', submission);

    const { error } = await supabase
      .from('contact_submissions')
      .insert({
        email: submission.email,
        comment: submission.comment
      });

    if (error) {
      console.error('Contact form submission error:', error);
      throw error;
    }

    console.log('Contact form submitted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to submit contact form. Please try again.' 
    };
  }
};
