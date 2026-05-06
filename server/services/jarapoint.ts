/**
 * JaraPoint VTU API Service
 * Handles airtime, data, and other VTU transactions
 */

const JARAPOINT_API_KEY = process.env.JARAPOINT_API_KEY || '';
const JARAPOINT_BASE_URL = 'https://jarapoint.com/api';

interface VTUResponse {
  status: boolean;
  message: string;
  data?: any;
  reference?: string;
}

/**
 * Buy Airtime
 */
export async function buyAirtime(phone: string, amount: number, network: string): Promise<VTUResponse> {
  try {
    const response = await fetch(`${JARAPOINT_BASE_URL}/airtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JARAPOINT_API_KEY}`,
      },
      body: JSON.stringify({
        phone,
        amount,
        network,
      }),
    });

    const data = await response.json();
    return {
      status: data.status || response.ok,
      message: data.message || 'Airtime purchase processed',
      data: data.data,
      reference: data.reference,
    };
  } catch (error: any) {
    console.error('JaraPoint Airtime Error:', error);
    return {
      status: false,
      message: error.message || 'Failed to process airtime purchase',
    };
  }
}

/**
 * Buy Data
 */
export async function buyData(phone: string, plan: string, network: string): Promise<VTUResponse> {
  try {
    const response = await fetch(`${JARAPOINT_BASE_URL}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JARAPOINT_API_KEY}`,
      },
      body: JSON.stringify({
        phone,
        plan,
        network,
      }),
    });

    const data = await response.json();
    return {
      status: data.status || response.ok,
      message: data.message || 'Data purchase processed',
      data: data.data,
      reference: data.reference,
    };
  } catch (error: any) {
    console.error('JaraPoint Data Error:', error);
    return {
      status: false,
      message: error.message || 'Failed to process data purchase',
    };
  }
}

/**
 * Buy Electricity
 */
export async function buyElectricity(meterNumber: string, amount: number, provider: string): Promise<VTUResponse> {
  try {
    const response = await fetch(`${JARAPOINT_BASE_URL}/electricity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JARAPOINT_API_KEY}`,
      },
      body: JSON.stringify({
        meter_number: meterNumber,
        amount,
        provider,
      }),
    });

    const data = await response.json();
    return {
      status: data.status || response.ok,
      message: data.message || 'Electricity purchase processed',
      data: data.data,
      reference: data.reference,
    };
  } catch (error: any) {
    console.error('JaraPoint Electricity Error:', error);
    return {
      status: false,
      message: error.message || 'Failed to process electricity purchase',
    };
  }
}

/**
 * Buy Cable TV
 */
export async function buyCableTV(iucNumber: string, plan: string, provider: string): Promise<VTUResponse> {
  try {
    const response = await fetch(`${JARAPOINT_BASE_URL}/cable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JARAPOINT_API_KEY}`,
      },
      body: JSON.stringify({
        iuc_number: iucNumber,
        plan,
        provider,
      }),
    });

    const data = await response.json();
    return {
      status: data.status || response.ok,
      message: data.message || 'Cable TV subscription processed',
      data: data.data,
      reference: data.reference,
    };
  } catch (error: any) {
    console.error('JaraPoint Cable TV Error:', error);
    return {
      status: false,
      message: error.message || 'Failed to process cable TV subscription',
    };
  }
}

/**
 * Check Transaction Status
 */
export async function checkTransactionStatus(reference: string): Promise<VTUResponse> {
  try {
    const response = await fetch(`${JARAPOINT_BASE_URL}/transaction/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JARAPOINT_API_KEY}`,
      },
    });

    const data = await response.json();
    return {
      status: data.status || response.ok,
      message: data.message || 'Transaction status retrieved',
      data: data.data,
    };
  } catch (error: any) {
    console.error('JaraPoint Transaction Status Error:', error);
    return {
      status: false,
      message: error.message || 'Failed to check transaction status',
    };
  }
}

/**
 * Get Data Plans
 */
export async function getDataPlans(network: string): Promise<VTUResponse> {
  try {
    const response = await fetch(`${JARAPOINT_BASE_URL}/data-plans/${network}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JARAPOINT_API_KEY}`,
      },
    });

    const data = await response.json();
    return {
      status: data.status || response.ok,
      message: data.message || 'Data plans retrieved',
      data: data.data,
    };
  } catch (error: any) {
    console.error('JaraPoint Data Plans Error:', error);
    return {
      status: false,
      message: error.message || 'Failed to retrieve data plans',
    };
  }
}
