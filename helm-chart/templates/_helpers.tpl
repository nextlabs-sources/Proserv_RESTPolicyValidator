{{- define "policy-validator.name" -}}
{{- .Chart.Name }}
{{- end }}

{{- define "policy-validator.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name }}
{{- end }}

{{- define "policy-validator.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end }}

{{- define "policy-validator.labels" -}}
helm.sh/chart: {{ include "policy-validator.chart" . }}
{{ include "policy-validator.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "policy-validator.selectorLabels" -}}
app.kubernetes.io/name: {{ include "policy-validator.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
