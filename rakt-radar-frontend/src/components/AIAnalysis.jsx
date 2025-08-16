import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Loader2, Brain, MapPin, Clock, TrendingUp, CheckCircle, AlertCircle, ShoppingCart, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIAnalysis = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const [aiResults, setAiResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBloodUnit, setSelectedBloodUnit] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [bloodRequest, setBloodRequest] = useState({
    blood_type: 'O+',
    quantity_ml: 450,
    urgency: 'high',
    location: 'Chennai'
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const startAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisSteps([]);
    setAiResults(null);
    setCurrentStep(0);
    setSelectedBloodUnit(null);

    try {
      const response = await fetch('http://localhost:8000/api/ai_blood_request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blood_type: bloodRequest.blood_type,
          quantity_ml: bloodRequest.quantity_ml,
          urgency: bloodRequest.urgency,
          location: { lat: 13.0827, lng: 80.2707 } // Chennai coordinates (Tamil Nadu)
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Simulate step-by-step AI thinking
        for (let i = 0; i < data.analysis_steps.length; i++) {
          setCurrentStep(i);
          setAnalysisSteps(data.analysis_steps.slice(0, i + 1));
          
          // Wait between steps to show AI thinking
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        setAiResults(data);
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const orderBlood = async (bloodUnit) => {
    setIsOrdering(true);
    try {
      const response = await fetch('http://localhost:8000/api/order_blood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blood_unit_id: bloodUnit.id,
          urgency: bloodRequest.urgency,
          quantity_ml: bloodRequest.quantity_ml
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Redirect to unit tracking page
        navigate('/unit-tracking', { 
          state: { 
            transferId: data.transfer_id,
            transferDetails: data 
          }
        });
      }
    } catch (error) {
      console.error('Order failed:', error);
    } finally {
      setIsOrdering(false);
    }
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 1: return <Brain className="w-5 h-5" />;
      case 2: return <TrendingUp className="w-5 h-5" />;
      case 3: return <AlertCircle className="w-5 h-5" />;
      case 4: return <MapPin className="w-5 h-5" />;
      case 5: return <TrendingUp className="w-5 h-5" />;
      case 6: return <Brain className="w-5 h-5" />;
      case 7: return <CheckCircle className="w-5 h-5" />;
      default: return <Loader2 className="w-5 h-5" />;
    }
  };

  const getStepColor = (step, status) => {
    if (status === 'completed') return 'text-green-600';
    if (step <= currentStep) return 'text-blue-600';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Blood Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            AI Blood Request Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blood_type">Blood Type *</Label>
              <Select 
                value={bloodRequest.blood_type} 
                onValueChange={(value) => setBloodRequest({...bloodRequest, blood_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select 
                value={bloodRequest.urgency} 
                onValueChange={(value) => setBloodRequest({...bloodRequest, urgency: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={level.color}>{level.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity Needed (ml)</Label>
              <Input
                id="quantity"
                type="number"
                value={bloodRequest.quantity_ml}
                onChange={(e) => setBloodRequest({...bloodRequest, quantity_ml: parseInt(e.target.value)})}
                placeholder="450"
              />
            </div>
            <div>
              <Label>Destination Hospital</Label>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">SRM Global Hospitals (Chennai, Tamil Nadu)</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Blood will be delivered to our hospital from other blood banks</p>
            </div>
          </div>
          <Button 
            onClick={startAIAnalysis} 
            disabled={isAnalyzing}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Start AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              AI Analysis in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">AI is thinking...</p>
            <Progress value={(currentStep + 1) * (100 / 7)} className="mb-4" />
            <p className="text-sm text-gray-500 mb-4">Step {currentStep + 1} of 7</p>
            <div className="space-y-3">
              {analysisSteps.map((step, index) => (
                <div key={step.step} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className={`${getStepColor(step.step, step.status)}`}>
                    {getStepIcon(step.step)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.message}</p>
                    <p className="text-sm text-gray-600">{step.details}</p>
                  </div>
                  <div className="w-16 h-1 bg-green-200 rounded-full">
                    <div className="w-full h-1 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Results */}
      {aiResults && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{aiResults.matches?.length || 0}</p>
                  <p className="text-sm text-gray-600">Matches Found</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{aiResults.matches?.length || 0}</p>
                  <p className="text-sm text-gray-600">Lives Saved</p>
                </div>
              </div>
              
              {aiResults.matches && aiResults.matches.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Available Blood Units</h3>
                  {aiResults.matches.map((match, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{match.blood_type}</Badge>
                            <Badge variant="outline">{match.quantity_ml}ml</Badge>
                            <Badge className="bg-blue-100 text-blue-800">AI Score: {match.ai_score}%</Badge>
                          </div>
                          <p className="font-medium">{match.source_name}</p>
                          <p className="text-sm text-gray-600">{match.source_city}, Tamil Nadu</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Distance: {match.distance_km}km</span>
                            <span>Est. Time: {match.estimated_time_hours}h</span>
                            <span>Route Quality: {match.route_quality}%</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => orderBlood(match)}
                          disabled={isOrdering}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isOrdering ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Ordering...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Order Blood
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAnalysis;
